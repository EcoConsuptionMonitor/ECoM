# ECoM Arduino

Código e utilitários para a parte de hardware do EcoMonitor (maquete).

## Hardware

- **Arduino Uno R3** (compatível)
- **3x ACS712 (5A)** — sensores de corrente elétrica (pinos A0, A1, A2)
- **2x YF-S201** — sensores de fluxo de água (pinos 2, 3)

## Ligações

### ACS712 (3 sensores)

| Sensor | VCC | GND | OUT            |
|--------|-----|-----|----------------|
| 1      | 5V  | GND | A0             |
| 2      | 5V  | GND | A1             |
| 3      | 5V  | GND | A2             |

O fio de corrente (fase da carga da maquete) passa pelo terminal do sensor.

### YF-S201 (2 sensores)

| Sensor | VCC | GND | Sinal          |
|--------|-----|-----|----------------|
| 1      | 5V  | GND | D2 (interrupt) |
| 2      | 5V  | GND | D3 (interrupt) |

O sensor de fluxo é instalado na mangueira da mini-residência (bomba de aquário p.ex.).

> **Segurança:** use apenas cargas de baixa tensão (lâmpadas LED, bomba de aquário, fontes isoladas).
> NUNCA ligue diretamente na rede elétrica da escola/feira sem supervisão de um professor.

## Como usar

1. Abra `ecom_sensors.ino` na Arduino IDE e faça upload para a placa.
2. Abra o Serial Monitor (9600 baud) para ver as leituras JSON.
3. Cadastre um ambiente na API (pelo app mobile/web) e guarde o `ambienteId` e o `token`.
4. Suba a API do backend (`cd ECoM-Back && npm run dev`).
5. Execute o bridge para encaminhar os dados à API:

```bash
cd ECoM-Arduino
npm install serialport
node bridge.js COM3 SEU_TOKEN
```

Se houver vários ambientes, defina qual recebe os dados:

```powershell
$env:AMBIENTE_ID = "1"
node bridge.js COM3 SEU_TOKEN
```

## Formato das leituras (Serial/JSON)

```json
{"corrente":[0.12,0.05,0.00],"fluxo":[10.5,20.3],"energiaKwh":0.87,"aguaLitros":15.5}
```

| Campo          | Significado                                    |
|----------------|------------------------------------------------|
| `corrente[]`   | Corrente RMS (A) de cada sensor ACS712         |
| `fluxo[]`      | Vazão instantânea (L/min) de cada YF-S201      |
| `energiaKwh`   | Energia acumulada (kWh) desde o último envio   |
| `aguaLitros`   | Volume acumulado (L) desde o último envio      |

As leituras são feitas a cada 5 segundos e enviadas pela Serial a cada 30 segundos.