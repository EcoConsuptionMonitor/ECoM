/**
 * EcoMonitor Bridge
 *
 * Lê as leituras JSON enviadas pelo Arduino na porta Serial e as encaminha
 * para a API do ECoM em http://localhost:3333.
 *
 * Uso:
 *   node bridge.js <PORTA_SERIAL> <TOKEN>
 *   node bridge.js COM3 meu-token-aqui
 *
 * Dependências:
 *   npm install serialport
 */

import { SerialPort } from 'serialport';
import { createInterface } from 'readline';

const [porta, token] = process.argv.slice(2);

if (!porta || !token) {
  console.error('Uso: node bridge.js <PORTA_SERIAL> <TOKEN>');
  console.error('Exemplo: node bridge.js COM3 abc123token');
  process.exit(1);
}

const API_URL = process.env.API_URL || 'http://localhost:3333';
const AMBIENTE_ID = process.env.AMBIENTE_ID;

const portaSerial = new SerialPort({
  path: porta,
  baudRate: 9600,
});

const rl = createInterface({ input: portaSerial });

rl.on('line', (linha) => {
  const texto = linha.trim();
  if (!texto.startsWith('{')) return;

  try {
    const dados = JSON.parse(texto);
    enviarParaApi(dados);
  } catch {
    // linha não é JSON: ignora
  }
});

async function enviarParaApi(dados) {
  if (!AMBIENTE_ID) {
    console.log(`${new Date().toLocaleTimeString()} -> sem AMBIENTE_ID, ignorando envio:`, dados);
    return;
  }

  const registros = [];

  if (dados.aguaLitros > 0) {
    registros.push({
      ambienteId: AMBIENTE_ID,
      tipo: 'agua',
      valor: parseFloat(dados.aguaLitros.toFixed(3)),
      unidade: 'L',
    });
  }

  if (dados.energiaKwh > 0) {
    registros.push({
      ambienteId: AMBIENTE_ID,
      tipo: 'energia',
      valor: parseFloat(dados.energiaKwh.toFixed(4)),
      unidade: 'kWh',
    });
  }

  for (const registro of registros) {
    try {
      const resposta = await fetch(`${API_URL}/consumo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(registro),
      });

      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => null);
        console.error('Erro ao enviar:', erro || resposta.status);
      } else {
        console.log(
          `${new Date().toLocaleTimeString()} -> ${registro.tipo}: ${registro.valor} ${registro.unidade}`
        );
      }
    } catch (e) {
      console.error('Falha de rede:', e.message);
    }
  }
}

console.log(`EcoMonitor Bridge conectado em ${porta}`);
console.log(`Enviando para ${API_URL} (ambiente: ${AMBIENTE_ID || 'não definido, use AMBIENTE_ID='})`);

portaSerial.on('error', (err) => {
  console.error('Erro na serial:', err.message);
});