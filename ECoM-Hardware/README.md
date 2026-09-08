# ECoM-Hardware (ESP32 + MicroPython)

Firmware oficial do EcoMonitor executado em **ESP32 com MicroPython**.
Leitura de **5x ACS712 (corrente)**, **3x YF-S201 (fluxo de água)**, controle de
**1 relé** (lâmpada) e da **bomba d'água**, enviando os dados por Wi-Fi
diretamente para a API do ECoM.

## Lista de materiais

| Qtd | Componente | Função |
|----|-----------|--------|
| 1 | ESP32 | Controla o sistema, lê os sensores e envia por Wi-Fi |
| 5 | ACS712 5A | Medem a corrente elétrica de 5 pontos/cargas |
| 5 | Resistores (2 por divisor) | Divisores de tensão do OUT do ACS712 p/ o ADC (0–3,3 V) |
| 3 | YF-S201 | Medem o fluxo de água em 3 pontos |
| 1 | Relé 1 canal | Liga/desliga a lâmpada LED (5V) |
| 1 | Bomba d'água 5V DC | Faz a água circular no sistema |
| 1 | Transistor NPN/MOSFET + diodo | Driver da bomba (GPIO não aguenta direto) |
| 1 | Fonte 5V DC | Alimenta o circuito e as cargas |
| 1 | Shield/base para ESP32 | Facilita a montagem |
| 1 | Lâmpada LED 5V | Representa a iluminação da residência |
| 1 | "Tomada" DC 5V | Representa uma tomada da residência |
| 1 | Reservatório | Armazena a água do sistema |
| 1 | Botão push (opcional) | Liga/desliga o relé manualmente (pin 4) |
| — | Mangueiras | Fazem a água circular pela bomba e sensores |
| — | Jumpers | Conexões elétricas |
| 2+ | Protoboard | Facilita a montagem dos circuitos |
| — | Bornes/conectores (opcional) | Organizam a montagem |

## Esquema de ligação

### Corrente — 5x ACS712 (saída analógica)

O OUT do ACS712 pode chegar a ~3,42 V (2,5 V ± 0,925 V) dependendo da carga,
acima dos 3,3 V do ESP32. Use um **divisor de tensão** em cada OUT.

| Pin ACS712 | ADC ESP32 |
|-----------|-----------|
| VCC | 5 V |
| GND | GND |
| OUT | divisor de tensão → 34, 35, 36, 39, 32 |

O divisor é 2 resistores: OUT conectado a R1, R1 no ADC, e R2 do ADC para GND.
`divisor_tensao` = `(R1 + R2) / R2`. Ex.: R1 = 5,6 kΩ e R2 = 11 kΩ ⇒ divisor 1,49.

### Fluxo — 3x YF-S201 (saída pulsada)

| Pin YF-S201 | ESP32 |
|------------|-------|
| VCC (vermelho) | 5 V |
| GND (preto) | GND |
| Sinal (amarelo) | 13 (fluxo 1) |
| Sinal (amarelo) | 14 (fluxo 2) |
| Sinal (amarelo) | 27 (fluxo 3) |

### Saídas e botão

| Componente | ESP32 |
|-----------|-------|
| Relé (sinal) | 26 |
| Bomba (base do transistor) | 25 |
| Botão push (para GND, pull-up interno) | 4 |

### Sistema hidráulico

```
Reservatório → Bomba 5V → YF-S201 (3 pontos) → saída/retorno
```

## Como usar

1. Grave o MicroPython no ESP32 (ex.: `esptool.py --chip esp32 --port COMx erase_flash`
   e depois `flash` com o firmware **ESP32_GENERIC** para a porta).
2. Instale os arquivos no dispositivo:

   ```bash
   # com mpremote (recomendado)
   pip install mpremote
   mpremote connect COMx fs cp boot.py main.py config.json :
   ```

3. Copie `config.example.json` para `config.json`, preencha Wi-Fi, token e o
   `ambienteId` (criado na API). **Use o IP local da máquina que roda a API
   (http://IP:3333) — "localhost" não funciona no ESP32.**
4. Reinicie o ESP32. O LED do módulo acende, conecta no Wi-Fi e começa a enviar.

## Mensagem enviada

A cada período (padrão 30 s) o ESP32 envia para `POST /sensores`:

```json
{ "ambienteId": "1", "tipo": "energia", "valor": 0.0312 }
{ "ambienteId": "1", "tipo": "agua", "valor": 1.245 }
```

Se o consumo de energia estiver acima do limite, a API gera um alerta automático.

## Ajustes úteis

- `valorPorUnidade` da água na API é em **R$/m³**; o firmware envia em litros e a
  API faz a conversão (1 000 L = 1 m³) ao calcular o custo.
- `sensibilidade_va` do ACS712 5A = 0,185 V/A. Para versões de outros ranges,
  consulte o datasheet e ajuste.
- Se preferir **não usar divisor de tensão**, deixe `divisor_tensao: 1.0`
  (cargas até ~4 A sem clipping).
- `intervalo_envio_s` controla a frequência de POST na API.

## Segurança

- Sensor ACS712 energizado fica quente; não coloque as mãos perto dele depois de ligado.
- Mantenha o circuito 5V isolado da parte de alta tensão (o ACS712 usa um único
  sensor; em bancada, prefira demonstrar com cargas de 5V/12V DC).
- Nada de alimentar cargas de 127/220V AC sem isolamento e proteção adequados.