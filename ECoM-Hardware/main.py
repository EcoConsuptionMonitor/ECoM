"""
ECoM - EcoMonitor (versão ESP32 / MicroPython)

Hardware:
  - 5x ACS712 (5A)  -> corrente elétrica (ADC1: pins 34, 35, 36, 39, 32)
  - 3x YF-S201      -> fluxo de água (pins 13, 14, 27) via interrupção
  - 1x Relé 1 canal -> lâmpada LED (pin 26)
  - 1x Bomba 5V DC  -> circulação de água (pin 25 + transistor)
  - 1x Botão        -> liga/desliga o relé (pin 4)

O ESP32 se conecta ao Wi-Fi e envia as leituras diretamente para a API do ECoM
(no PC da bancada, use o IP local da máquina em config.json).

Configuração: copie config.example.json para config.json e preencha.
"""

import json
import math
import machine
import network
import socket
import time

# ===================== Configuração =====================
with open("config.json", "r") as f:
    CONFIG = json.load(f)

WIFI_SSID = CONFIG["wifi"]["ssid"]
WIFI_SENHA = CONFIG["wifi"]["senha"]

API_URL = CONFIG["api"]["url"]
API_TOKEN = CONFIG["api"]["token"]
AMBIENTE_ID = CONFIG["api"]["ambienteId"]

INTERVALO_MEDICAO_MS = CONFIG["leitura"].get("intervalo_medicao_ms", 5000)
INTERVALO_ENVIO_S = CONFIG["leitura"].get("intervalo_envio_s", 30)
AMOSTRAS_RMS = CONFIG["leitura"].get("amostras_rms", 400)
TENSAO_V = CONFIG["leitura"].get("tensao_v", 127.0)

SENSIBILIDADE_VA = CONFIG.get("acs712", {}).get("sensibilidade_va", 0.185)
DIVISOR_TENSAO = CONFIG.get("acs712", {}).get("divisor_tensao", 1.0)

PULSOS_POR_LITRO = 450  # YF-S201: Q(L/min) = F(Hz) * 60 / 450

ADC_REF = 3.3
ADC_FULL = 65535.0

# ===================== Pinos =====================
PINS_ACS = [34, 35, 36, 39, 32]
PINS_FLUXO = [13, 14, 27]
PIN_RELE = 26
PIN_BOMBA = 25
PIN_BOTAO = 4

# ===================== Estado global =====================
pulso_fluxo = [0, 0, 0]
offsets = [0.0, 0.0, 0.0, 0.0, 0.0]

energia_acumulada_kwh = [0.0, 0.0, 0.0, 0.0, 0.0]
agua_acumulada_litros = [0.0, 0.0, 0.0]

tempo_ultima_medicao = 0
tempo_ultimo_envio = 0
tempo_ultima_leitura_fluxo = 0
relé_ligado = False
ultimo_botao = 0


# ===================== Sensores de fluxo (YF-S201) =====================
def fluxo_irq(idx):
    def handler(pin):
        pulso_fluxo[idx] += 1
    return handler


fluxo_pins = []
for i, pin_num in enumerate(PINS_FLUXO):
    p = machine.Pin(pin_num, machine.Pin.IN, machine.Pin.PULL_UP)
    p.irq(handler=fluxo_irq(i), trigger=machine.Pin.IRQ_RISING)
    fluxo_pins.append(p)


# ===================== Corrente (ACS712) =====================
acs_adcs = []
for pin_num in PINS_ACS:
    adc = machine.ADC(machine.Pin(pin_num))
    adc.atten(machine.ADC.ATTN_11DB)
    adc.width(machine.ADC.WIDTH_12BIT)
    acs_adcs.append(adc)


def ler_tensao(adc):
    return adc.read_u16() / ADC_FULL * ADC_REF


def ler_offset(adc, amostras=100):
    soma = 0.0
    for _ in range(amostras):
        soma += ler_tensao(adc)
    media = soma / amostras
    return media * DIVISOR_TENSAO


def ler_corrente_rms(adc, offset, amostras):
    soma_q = 0.0
    for _ in range(amostras):
        v = ler_tensao(adc) * DIVISOR_TENSAO
        d = v - offset
        soma_q += d * d
    rms_v = math.sqrt(soma_q / amostras)
    return rms_v / SENSIBILIDADE_VA


def calibrar():
    global offsets
    for i, adc in enumerate(acs_adcs):
        offsets[i] = ler_offset(adc)
        print(f"  ACS712[{i}] offset = {offsets[i]:.3f} V")


# ===================== iOS / Saída =====================
rele = machine.Pin(PIN_RELE, machine.Pin.OUT)
bomba = machine.Pin(PIN_BOMBA, machine.Pin.OUT)

botao = machine.Pin(PIN_BOTAO, machine.Pin.IN, machine.Pin.PULL_UP)


def alternar_rele():
    global relé_ligado
    relé_ligado = not relé_ligado
    rele.value(1 if relé_ligado else 0)
    print(f"  Relé {'LIGADO' if relé_ligado else 'DESLIGADO'}")


def botao_irq(pin):
    global ultimo_botao
    agora = time.ticks_ms()
    if time.ticks_diff(agora, ultimo_botao) < 250:
        return
    ultimo_botao = agora
    alternar_rele()


botao.irq(handler=botao_irq, trigger=machine.Pin.IRQ_FALLING)


# ===================== Wi-Fi =====================
def conectar_wifi():
    sta = network.WLAN(network.STA_IF)
    sta.active(True)
    if not sta.isconnected():
        print("Conectando ao Wi-Fi...")
        sta.connect(WIFI_SSID, WIFI_SENHA)
        for _ in range(60):
            if sta.isconnected():
                break
            time.sleep(0.5)
    if sta.isconnected():
        print(f"Wi-Fi conectado: {sta.ifconfig()[0]}")
        return True
    print("Falha ao conectar no Wi-Fi. Tentando de novo no próximo envio.")
    return False


# ===================== HTTP (socket puro, sem dependências) =====================
def parse_url(url):
    url = url.replace("http://", "")
    if "/" in url:
        host, resto = url.split("/", 1)
        caminho = "/" + resto
    else:
        host, caminho = url, "/"
    if ":" in host:
        h, p = host.split(":", 1)
        return h, int(p), caminho
    return host, 80, caminho


def enviar_para_api(dados):
    host, porta, _ = parse_url(API_URL)
    payload = json.dumps(dados)

    try:
        addr = socket.getaddrinfo(host, porta)[0][4]
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(10)
        s.connect(addr)
        requisicao = (
            "POST /sensores HTTP/1.1\r\n"
            f"Host: {host}:{porta}\r\n"
            f"Authorization: Bearer {API_TOKEN}\r\n"
            "Content-Type: application/json\r\n"
            f"Content-Length: {len(payload)}\r\n"
            "Connection: close\r\n\r\n"
        )
        s.send(requisicao.encode())
        s.send(payload.encode())
        resp = s.recv(2048)
        s.close()
        status = int(resp.split(b" ")[1])
        return status == 201 or status == 200
    except Exception as e:
        print(f"  Erro ao enviar: {e}")
        return False


# ===================== Loop principal =====================
def main():
    global tempo_ultima_medicao, tempo_ultimo_envio, tempo_ultima_leitura_fluxo

    print("ECoM - Iniciando ESP32...")
    calibrar()
    bomba.value(1)  # liga a bomba ao iniciar
    rele.value(0)
    tem_wifi = conectar_wifi()

    tempo_ultima_medicao = time.ticks_ms()
    tempo_ultimo_envio = time.ticks_ms()
    tempo_ultima_leitura_fluxo = time.ticks_ms()

    while True:
        agora = time.ticks_ms()

        # ---- Medição periódica ----
        if time.ticks_diff(agora, tempo_ultima_medicao) >= INTERVALO_MEDICAO_MS:
            intervalo_ms = time.ticks_diff(agora, tempo_ultima_medicao)
            tempo_ultima_medicao = agora

            corrente = []
            for i, adc in enumerate(acs_adcs):
                c = ler_corrente_rms(adc, offsets[i], AMOSTRAS_RMS)
                corrente.append(c)
                potencia_w = c * TENSAO_V
                energia_acumulada_kwh[i] += potencia_w * (intervalo_ms / 3.6e9)

            fluxo = []
            for i in range(len(PINS_FLUXO)):
                noInterrupt = pulso_fluxo[i]
                pulso_fluxo[i] = 0
                litros = noInterrupt / PULSOS_POR_LITRO
                if tempo_ultima_leitura_fluxo > 0:
                    minutos = time.ticks_diff(agora, tempo_ultima_leitura_fluxo) / 60000.0
                    fluxo.append(litros / max(minutos, 0.001))
                else:
                    fluxo.append(0.0)
                agua_acumulada_litros[i] += litros
            tempo_ultima_leitura_fluxo = agora

        # ---- Envio periódico ----
        if time.ticks_diff(agora, tempo_ultimo_envio) >= INTERVALO_ENVIO_S * 1000:
            tempo_ultimo_envio = agora

            if not network.WLAN(network.STA_IF).isconnected():
                tem_wifi = conectar_wifi()

            if tem_wifi:
                energia_total = sum(energia_acumulada_kwh)
                agua_total = sum(agua_acumulada_litros)

                dados = {
                    "ambienteId": AMBIENTE_ID,
                    "tipo": "energia",
                    "valor": round(energia_total, 4),
                }
                if energia_total > 0:
                    if enviar_para_api(dados):
                        for i in range(len(energia_acumulada_kwh)):
                            energia_acumulada_kwh[i] = 0.0

                dados_agua = {
                    "ambienteId": AMBIENTE_ID,
                    "tipo": "agua",
                    "valor": round(agua_total, 3),
                }
                if agua_total > 0:
                    if enviar_para_api(dados_agua):
                        for i in range(len(agua_acumulada_litros)):
                            agua_acumulada_litros[i] = 0.0

                print(
                    f"[{time.localtime()[3]:02d}:{time.localtime()[4]:02d}] "
                    f"energia={energia_total:.4f} kWh agua={agua_total:.3f} L "
                    f"rele={'ON' if relé_ligado else 'OFF'}"
                )
            else:
                print("Sem Wi-Fi, aguardando próximo ciclo...")


main()