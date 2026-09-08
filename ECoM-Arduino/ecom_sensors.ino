/*
 * ECoM - EcoMonitor
 * Leitura de sensores da mini-residência (maquete)
 * Arduino Uno R3
 *
 * Sensores:
 *   - 3x ACS712 (5A)  -> corrente elétrica (pinos A0, A1, A2)
 *   - 2x YF-S201      -> fluxo de água (pinos 2, 3)
 *
 * O Arduino imprime leituras em JSON na porta Serial, por exemplo:
 *   {"corrente":[0.12,0.05,0.00],"fluxo":[10.5,20.3],"energiaKwh":0.87,"aguaLitros":15.5}
 *
 * Um "bridge" (script Python/Node) lê a serial e envia para a API.
 */

// ===== Pinos dos sensores =====
const int ACS712_PIN[] = { A0, A1, A2 };   // 3 sensores de corrente (5A)
const int YFS201_PIN[] = { 2, 3 };         // 2 sensores de fluxo de água

const int NUM_ACS712 = 3;
const int NUM_YFS201 = 2;

// ===== Constantes dos sensores =====
const float ACS712_SENSITIVITY = 0.185;    // V/A para a versão 5A
const float ACS712_VCC = 5.0;              // tensão de alimentação
const float YFS201_PULSOS_POR_LITRO = 7.5; // pulsos por litro (Q = F/7.5)

// ===== Configuração de envio =====
const unsigned long INTERVALO_MEDICAO = 5000; // ms entre leituras
const unsigned long INTERVALO_ENVIO = 30000;  // ms entre envios acumulados

// ===== Variáveis globais =====
unsigned long ultimaMedicao = 0;
unsigned long ultimoEnvio = 0;

float correnteAtual[NUM_ACS712] = { 0, 0, 0 };
float fluxoAtual[NUM_YFS201] = { 0, 0 };

volatile unsigned long pulsosYFS201[NUM_YFS201] = { 0, 0 };
unsigned long lastPulsoTime[NUM_YFS201] = { 0, 0 };
unsigned long ultimaLeituraFluxo = 0;

float energiaAcumuladaKwh[NUM_ACS712] = { 0, 0, 0 }; // energia por trecho (W.h)
float aguaAcumuladaLitros[NUM_YFS201] = { 0, 0 };    // volume total por sensor (L)
unsigned long energiaTimer[NUM_ACS712] = { 0, 0, 0 };
unsigned long aguaTimer[NUM_YFS201] = { 0, 0, 0 };

// ===== Interrupções dos sensores de fluxo =====
void contaPulso0() {
  pulsosYFS201[0]++;
}
void contaPulso1() {
  pulsosYFS201[1]++;
}

void setup() {
  Serial.begin(9600);

  // Configura interrupções para o YF-S201 (saída digital)
  pinMode(YFS201_PIN[0], INPUT_PULLUP);
  pinMode(YFS201_PIN[1], INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(YFS201_PIN[0]), contaPulso0, RISING);
  attachInterrupt(digitalPinToInterrupt(YFS201_PIN[1]), contaPulso1, RISING);

  // Calibra o ponto zero dos sensores de corrente
  for (int i = 0; i < NUM_ACS712; i++) {
    offsetACS712[i] = lerOffsetACS712(ACS712_PIN[i]);
  }

  Serial.println(F("ECoM - Iniciando monitor..."));
  Serial.flush();
}

// ===== Calibração (leitura do nível zero do ACS712) =====
float lerOffsetACS712(int pino, int amostras = 200) {
  long soma = 0;
  for (int i = 0; i < amostras; i++) {
    soma += analogRead(pino);
  }
  float media = soma / amostras;
  float tensao = media * ACS712_VCC / 1023.0;
  return tensao;
}

float offsetACS712[NUM_ACS712];

// ===== Leitura RMS de corrente (AC) =====
float lerCorrenteRMS(int pino, float offsetTensao, int amostras = 400) {
  float somaQ = 0.0;
  for (int i = 0; i < amostras; i++) {
    float v = analogRead(pino) * ACS712_VCC / 1023.0;
    float diferenca = v - offsetTensao;
    somaQ += diferenca * diferenca;
  }
  float rmsV = sqrt(somaQ / amostras);
  return rmsV / ACS712_SENSITIVITY;
}

// ===== Fluxo a partir dos pulsos acumulados =====
float lerFluxo(int sensor) {
  noInterrupts();
  unsigned long pulsos = pulsosYFS201[sensor];
  pulsosYFS201[sensor] = 0;
  interrupts();

  float litros = pulsos / YFS201_PULSOS_POR_LITRO;
  return litros;
}

void loop() {
  unsigned long agora = millis();

  // Faz medição periódica
  if (agora - ultimaMedicao >= INTERVALO_MEDICAO) {
    ultimaMedicao = agora;

    // Mede corrente nos 3 sensores
    for (int i = 0; i < NUM_ACS712; i++) {
      correnteAtual[i] = lerCorrenteRMS(ACS712_PIN[i], offsetACS712[i]);

      // Integra energia: P = I x V, considerando 127V (baixa tensão da maquete ou rede)
      // E = P x tempo(horas). Usa intervalo medido em ms.
      unsigned long dt = agora - energiaTimer[i];
      if (energiaTimer[i] > 0 && dt > 0) {
        float potenciaW = correnteAtual[i] * 127.0;
        float energiaWh = potenciaW * (dt / 3600000.0); // W.h
        energiaAcumuladaKwh[i] += energiaWh / 1000.0;   // kWh
      }
      energiaTimer[i] = agora;
    }

    // Mede fluxo de água (litros acumulados desde a última leitura)
    for (int i = 0; i < NUM_YFS201; i++) {
      float litros = lerFluxo(i);
      if (ultimaLeituraFluxo > 0) {
        float minutos = (agora - ultimaLeituraFluxo) / 60000.0;
        fluxoAtual[i] = litros / max(minutos, 0.001); // L/min (instantâneo por intervalo)
      } else {
        fluxoAtual[i] = 0;
      }
      aguaAcumuladaLitros[i] += litros;
    }
    ultimaLeituraFluxo = agora;
  }

  // Envio acumulado periódico
  if (agora - ultimoEnvio >= INTERVALO_ENVIO) {
    ultimoEnvio = agora;

    float energiaTotalKwh = 0;
    for (int i = 0; i < NUM_ACS712; i++) {
      energiaTotalKwh += energiaAcumuladaKwh[i];
      energiaAcumuladaKwh[i] = 0;
    }

    float aguaTotalLitros = 0;
    for (int i = 0; i < NUM_YFS201; i++) {
      aguaTotalLitros += aguaAcumuladaLitros[i];
      aguaAcumuladaLitros[i] = 0;
    }

    Serial.print(F("{\"corrente\":["));
    for (int i = 0; i < NUM_ACS712; i++) {
      if (i > 0) Serial.print(F(","));
      Serial.print(correnteAtual[i], 3);
    }
    Serial.print(F("],\"fluxo\":["));
    for (int i = 0; i < NUM_YFS201; i++) {
      if (i > 0) Serial.print(F(","));
      Serial.print(fluxoAtual[i], 2);
    }
    Serial.print(F("],\"energiaKwh\":"));
    Serial.print(energiaTotalKwh, 4);
    Serial.print(F(",\"aguaLitros\":"));
    Serial.print(aguaTotalLitros, 3);
    Serial.println(F("}"));
    Serial.flush();
  }
}