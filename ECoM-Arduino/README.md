# ECoM Arduino — ESP32

Firmware para a maquete do EcoMonitor compilado pela Arduino IDE para ESP32.
Ele mede cinco circuitos de corrente, três circuitos de água, controla um relé
e publica uma linha JSON na Serial a cada 30 segundos. O `bridge.js` recebe
esse JSON e o envia à API do ECoM.

## Ligações

| Componente | Sinal | GPIO do ESP32 |
|---|---|---:|
| ACS712 1 | OUT | 32 |
| ACS712 2 | OUT | 33 |
| ACS712 3 | OUT | 34 |
| ACS712 4 | OUT | 35 |
| ACS712 5 | OUT | 4 |
| YF-S201 1 | Sinal | 25 |
| YF-S201 2 | Sinal | 26 |
| YF-S201 3 | Sinal | 27 |
| Módulo relé | IN | 18 |

Ligue todos os `GND` em comum. Os ACS712 e YF-S201 usam 5 V; o relé deve ser
alimentado conforme a especificação do módulo e da carga que ele comanda.

> **Atenção — ACS712:** o sinal `OUT` é de até 5 V quando o módulo é
> alimentado em 5 V. O GPIO do ESP32 aceita no máximo 3,3 V. Instale um
> divisor de tensão em cada saída, por exemplo: 10 kΩ entre `OUT` e GPIO e
> 20 kΩ entre GPIO e `GND`. Essa montagem reduz 5 V para aproximadamente
> 3,33 V. Nunca conecte `OUT` diretamente ao ESP32.

O divisor sugerido tem fator 1,5 e já está configurado em
`FATOR_DIVISOR_TENSAO`. Se montar outra proporção, ajuste essa constante.

## Upload e calibração

1. Instale o pacote de placas **ESP32 by Espressif Systems** na Arduino IDE.
2. Abra [ecom_sensors.ino](ecom_sensors.ino) e escolha a sua placa e porta.
3. Antes de enviar ou reiniciar, deixe todas as cargas que passam pelos
   ACS712 desligadas. O firmware calcula o ponto zero na inicialização.
4. Abra o Monitor Serial em **9600 baud**. A leitura JSON aparece a cada 30 s.

Para ACS712 de 20 A ou 30 A, altere `SENSIBILIDADE_ACS_V_POR_A` para `0.100`
ou `0.066`, respectivamente. Calibre o YF-S201 ajustando
`PULSOS_POR_LITRO` após medir o volume real de água.

## Relé

Envie um dos comandos abaixo pelo Monitor Serial, com “Newline” habilitado:

```text
RELE ON
RELE OFF
RELE TOGGLE
```

O código considera relé ativo em nível baixo, comum nesses módulos. Caso o
seu relé opere invertido, mude `RELE_ATIVO_EM_LOW` para `false`.

## Integração com o ECoM

Com a API em execução, informe a porta, token e ambiente para o bridge:

```powershell
cd ECoM-Arduino
npm install serialport
$env:AMBIENTE_ID = "1"
node bridge.js COM3 SEU_TOKEN
```

Substitua `COM3`, o token e o ID do ambiente pelos seus valores. O bridge usa
`http://localhost:3333` por padrão; defina `API_URL` se a API estiver em outra
máquina.

## JSON emitido

```json
{"corrente":[0.12,0.05,0,0,0],"fluxo":[1.5,0,0],"energiaKwh":0.00025,"aguaLitros":0.125,"rele":false}
```

- `corrente`: corrente RMS em ampères para cada ACS712;
- `fluxo`: vazão em L/min para cada YF-S201;
- `energiaKwh`: energia acumulada desde o último JSON;
- `aguaLitros`: volume acumulado desde o último JSON;
- `rele`: estado do relé.
