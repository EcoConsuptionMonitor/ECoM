/*
 * ECoM - EcoMonitor (ESP32 / Arduino IDE)
 *
 * Ligações:
 *   ACS712 (OUT): GPIO 32, 33, 34, 35 e 4
 *   YF-S201 (SINAL): GPIO 25, 26 e 27
 *   Relé (IN): GPIO 18
 *
 * Importante: a saída do ACS712 alimentado em 5 V pode chegar a 5 V.
 * Use um divisor de tensão entre cada OUT do ACS712 e o GPIO do ESP32.
 * Nunca ligue OUT diretamente ao ESP32, que aceita no máximo 3,3 V.
 *
 * O sketch escreve um JSON na Serial a cada 30 segundos. O bridge.js
 * encaminha os totais de água e energia para a API do ECoM.
 *
 * Comandos pelo Monitor Serial (9600 baud, fim de linha):
 *   RELE ON
 *   RELE OFF
 *   RELE TOGGLE
 */

#include <Arduino.h>
#include <math.h>

// ===== Pinos =====
const uint8_t PINOS_ACS[] = {32, 33, 34, 35, 4};
const uint8_t PINOS_FLUXO[] = {25, 26, 27};
const uint8_t PIN_RELE = 18;

const uint8_t NUM_ACS = sizeof(PINOS_ACS) / sizeof(PINOS_ACS[0]);
const uint8_t NUM_FLUXO = sizeof(PINOS_FLUXO) / sizeof(PINOS_FLUXO[0]);

// ===== Configuração =====
// ACS712-05B = 0,185 V/A. Para ACS712-20A use 0,100; para ACS712-30A, 0,066.
const float SENSIBILIDADE_ACS_V_POR_A = 0.185f;
const float TENSAO_REDE_V = 127.0f;
const float CORRENTE_MINIMA_A = 0.03f;
const uint16_t AMOSTRAS_RMS = 600;

// Fator para reconstruir a tensão antes do divisor. Exemplo: divisor com
// 10 kOhm entre OUT e GPIO e 20 kOhm entre GPIO e GND => fator 1,5.
const float FATOR_DIVISOR_TENSAO = 1.5f;

// YF-S201: aproximadamente 450 pulsos para cada litro de água.
const float PULSOS_POR_LITRO = 450.0f;
const unsigned long INTERVALO_MEDICAO_MS = 5000UL;
const unsigned long INTERVALO_ENVIO_MS = 30000UL;

// A maior parte dos módulos de relé de um canal é ativa em LOW.
const bool RELE_ATIVO_EM_LOW = true;

// ===== Estado =====
float offsetsACS[NUM_ACS] = {0};
float correnteAtual[NUM_ACS] = {0};
float fluxoAtual[NUM_FLUXO] = {0};
float energiaAcumuladaKwh[NUM_ACS] = {0};
float aguaAcumuladaLitros[NUM_FLUXO] = {0};

volatile unsigned long pulsosFluxo[NUM_FLUXO] = {0};
unsigned long ultimaMedicao = 0;
unsigned long ultimoEnvio = 0;
unsigned long ultimaLeituraFluxo = 0;
bool releLigado = false;

char comandoSerial[24];
uint8_t tamanhoComando = 0;

// ===== Interrupções dos YF-S201 =====
void IRAM_ATTR contarPulso0() { pulsosFluxo[0]++; }
void IRAM_ATTR contarPulso1() { pulsosFluxo[1]++; }
void IRAM_ATTR contarPulso2() { pulsosFluxo[2]++; }

// ===== ACS712 =====
float lerTensaoACS(uint8_t pino) {
  // analogReadMilliVolts usa a calibração do ESP32 e retorna a tensão no GPIO.
  return (analogReadMilliVolts(pino) / 1000.0f) * FATOR_DIVISOR_TENSAO;
}

float lerOffsetACS(uint8_t pino) {
  float soma = 0.0f;
  const uint16_t amostras = 300;

  for (uint16_t i = 0; i < amostras; i++) {
    soma += lerTensaoACS(pino);
  }
  return soma / amostras;
}

float lerCorrenteRMS(uint8_t pino, float offset) {
  float somaQuadrados = 0.0f;

  for (uint16_t i = 0; i < AMOSTRAS_RMS; i++) {
    float diferenca = lerTensaoACS(pino) - offset;
    somaQuadrados += diferenca * diferenca;
  }

  float corrente = sqrtf(somaQuadrados / AMOSTRAS_RMS) / SENSIBILIDADE_ACS_V_POR_A;
  return corrente < CORRENTE_MINIMA_A ? 0.0f : corrente;
}

// ===== Relé =====
void definirRele(bool ligar) {
  releLigado = ligar;
  const uint8_t nivelAtivo = RELE_ATIVO_EM_LOW ? LOW : HIGH;
  digitalWrite(PIN_RELE, ligar ? nivelAtivo : (nivelAtivo == HIGH ? LOW : HIGH));
}

void processarComandoSerial() {
  while (Serial.available() > 0) {
    char caractere = static_cast<char>(Serial.read());
    if (caractere == '\r') continue;

    if (caractere == '\n') {
      comandoSerial[tamanhoComando] = '\0';

      if (strcmp(comandoSerial, "RELE ON") == 0) {
        definirRele(true);
        Serial.println(F("Relé ligado"));
      } else if (strcmp(comandoSerial, "RELE OFF") == 0) {
        definirRele(false);
        Serial.println(F("Relé desligado"));
      } else if (strcmp(comandoSerial, "RELE TOGGLE") == 0) {
        definirRele(!releLigado);
        Serial.println(releLigado ? F("Relé ligado") : F("Relé desligado"));
      } else if (tamanhoComando > 0) {
        Serial.println(F("Comando inválido: RELE ON, RELE OFF ou RELE TOGGLE"));
      }
      tamanhoComando = 0;
    } else if (tamanhoComando < sizeof(comandoSerial) - 1) {
      comandoSerial[tamanhoComando++] = caractere;
    }
  }
}

void medirSensores(unsigned long agora) {
  const unsigned long intervaloMedicao = agora - ultimaMedicao;
  ultimaMedicao = agora;

  for (uint8_t i = 0; i < NUM_ACS; i++) {
    correnteAtual[i] = lerCorrenteRMS(PINOS_ACS[i], offsetsACS[i]);
    const float potenciaW = correnteAtual[i] * TENSAO_REDE_V;
    energiaAcumuladaKwh[i] += potenciaW * intervaloMedicao / 3600000000.0f;
  }

  unsigned long pulsos[NUM_FLUXO];
  noInterrupts();
  for (uint8_t i = 0; i < NUM_FLUXO; i++) {
    pulsos[i] = pulsosFluxo[i];
    pulsosFluxo[i] = 0;
  }
  interrupts();

  float intervaloMinutos = (agora - ultimaLeituraFluxo) / 60000.0f;
  if (intervaloMinutos < 0.001f) intervaloMinutos = 0.001f;

  for (uint8_t i = 0; i < NUM_FLUXO; i++) {
    const float litros = pulsos[i] / PULSOS_POR_LITRO;
    fluxoAtual[i] = litros / intervaloMinutos;
    aguaAcumuladaLitros[i] += litros;
  }
  ultimaLeituraFluxo = agora;
}

void publicarLeituraSerial() {
  float energiaTotal = 0.0f;
  float aguaTotal = 0.0f;

  for (uint8_t i = 0; i < NUM_ACS; i++) {
    energiaTotal += energiaAcumuladaKwh[i];
    energiaAcumuladaKwh[i] = 0.0f;
  }
  for (uint8_t i = 0; i < NUM_FLUXO; i++) {
    aguaTotal += aguaAcumuladaLitros[i];
    aguaAcumuladaLitros[i] = 0.0f;
  }

  Serial.print(F("{\"corrente\":["));
  for (uint8_t i = 0; i < NUM_ACS; i++) {
    if (i > 0) Serial.print(',');
    Serial.print(correnteAtual[i], 3);
  }
  Serial.print(F("],\"fluxo\":["));
  for (uint8_t i = 0; i < NUM_FLUXO; i++) {
    if (i > 0) Serial.print(',');
    Serial.print(fluxoAtual[i], 3);
  }
  Serial.print(F("],\"energiaKwh\":"));
  Serial.print(energiaTotal, 6);
  Serial.print(F(",\"aguaLitros\":"));
  Serial.print(aguaTotal, 3);
  Serial.print(F(",\"rele\":"));
  Serial.print(releLigado ? F("true") : F("false"));
  Serial.println(F("}"));
}

void setup() {
  Serial.begin(9600);

  pinMode(PIN_RELE, OUTPUT);
  definirRele(false);

  // Atenuação 11 dB: faixa de leitura do ADC próxima de 3,3 V no GPIO.
  analogReadResolution(12);
  for (uint8_t i = 0; i < NUM_ACS; i++) {
    analogSetPinAttenuation(PINOS_ACS[i], ADC_11db);
  }

  for (uint8_t i = 0; i < NUM_FLUXO; i++) {
    pinMode(PINOS_FLUXO[i], INPUT_PULLUP);
  }
  attachInterrupt(digitalPinToInterrupt(PINOS_FLUXO[0]), contarPulso0, RISING);
  attachInterrupt(digitalPinToInterrupt(PINOS_FLUXO[1]), contarPulso1, RISING);
  attachInterrupt(digitalPinToInterrupt(PINOS_FLUXO[2]), contarPulso2, RISING);

  Serial.println(F("ECoM - Calibrando ACS712. Mantenha as cargas desligadas."));
  for (uint8_t i = 0; i < NUM_ACS; i++) {
    offsetsACS[i] = lerOffsetACS(PINOS_ACS[i]);
    Serial.printf("ACS712 %u: offset %.3f V\n", i + 1, offsetsACS[i]);
  }

  const unsigned long agora = millis();
  ultimaMedicao = agora;
  ultimoEnvio = agora;
  ultimaLeituraFluxo = agora;
  Serial.println(F("ECoM - Monitor iniciado."));
}

void loop() {
  processarComandoSerial();
  const unsigned long agora = millis();

  if (agora - ultimaMedicao >= INTERVALO_MEDICAO_MS) {
    medirSensores(agora);
  }

  if (agora - ultimoEnvio >= INTERVALO_ENVIO_MS) {
    ultimoEnvio = agora;
    publicarLeituraSerial();
  }
}
