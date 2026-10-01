import { Router } from 'express';
import { comTransacao, reduzirSensor, reduzirConsumo, reduzirAlerta } from '../lib/db.js';
import { autenticar } from '../middleware/auth.js';
import { obterTarifas } from '../lib/tarifas.js';

const router = Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  const resultado = await comTransacao(async (client) => {
    const r = await client.query('SELECT * FROM sensores WHERE user_id = $1', [
      req.userId,
    ]);
    return r.rows;
  });
  return res.json(resultado.map(reduzirSensor));
});

router.post('/', async (req, res) => {
  const { ambienteId, tipo, valor, unidade, potencia, corrente, tensao } =
    req.body || {};

  if (!ambienteId || !tipo || valor == null) {
    return res
      .status(400)
      .json({ erro: 'Campos obrigatórios: ambienteId, tipo e valor.' });
  }
  if (!['agua', 'energia'].includes(tipo)) {
    return res
      .status(400)
      .json({ erro: 'O campo tipo deve ser "agua" ou "energia".' });
  }
  const valorNumerico = Number(valor);
  if (!Number.isFinite(valorNumerico) || valorNumerico < 0) {
    return res.status(400).json({
      erro: 'O campo valor deve ser um número maior ou igual a zero.',
    });
  }

  const ambiente = await comTransacao(async (client) => {
    const r = await client.query(
      'SELECT id FROM ambientes WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [ambienteId, req.userId]
    );
    return r.rows[0] || null;
  });
  if (!ambiente) {
    return res
      .status(404)
      .json({ erro: 'Ambiente não encontrado para este usuário.' });
  }

  const leitura = await comTransacao(async (client) => {
    const r = await client.query(
      `INSERT INTO sensores (user_id, ambiente_id, tipo, valor, unidade, potencia, corrente, tensao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.userId,
        ambienteId,
        tipo,
        valorNumerico,
        unidade || (tipo === 'agua' ? 'L/min' : 'A'),
        potencia != null ? Number(potencia) : null,
        corrente != null ? Number(corrente) : null,
        tensao != null ? Number(tensao) : null,
      ]
    );
    return reduzirSensor(r.rows[0]);
  });

  const registroConsumo = await comTransacao(async (client) => {
    const r = await client.query(
      `INSERT INTO consumo (user_id, ambiente_id, tipo, valor, unidade, fonte)
       VALUES ($1, $2, $3, $4, $5, 'sensor')
       RETURNING *`,
      [req.userId, ambienteId, tipo, valorNumerico, tipo === 'agua' ? 'L' : 'kWh']
    );
    return reduzirConsumo(r.rows[0]);
  });

  const tarifas = await obterTarifas(req.userId);
  const valorPorUnidade = tarifas[tipo];

  const somaTotal = await comTransacao(async (client) => {
    const r = await client.query(
      `SELECT COALESCE(SUM(valor), 0) AS total
       FROM consumo
       WHERE user_id = $1 AND tipo = $2`,
      [req.userId, tipo]
    );
    return Number(r.rows[0].total);
  });

  const fator = tipo === 'agua' ? 1 / 1000 : 1;
  const custoTotal = somaTotal * fator * valorPorUnidade;

  if (tipo === 'energia' && valorNumerico > 5) {
    const jaExiste = await comTransacao(async (client) => {
      const r = await client.query(
        `SELECT id FROM alertas
         WHERE user_id = $1 AND tipo = $2 AND lido = false
           AND mensagem LIKE '%elevado%'
         LIMIT 1`,
        [req.userId, tipo]
      );
      return r.rowCount > 0;
    });

    if (!jaExiste) {
      await comTransacao(async (client) => {
        await client.query(
          `INSERT INTO alertas (user_id, mensagem, nivel, tipo)
           VALUES ($1, $2, 'critico', $3)`,
          [
            req.userId,
            `Consumo elevado de energia detectado: ${valorNumerico} ${leitura.unidade}`,
            tipo,
          ]
        );
      });
    }
  }

  return res.status(201).json({
    leitura,
    registro: registroConsumo,
    totais: {
      consumoTotal: somaTotal,
      custoTotal: Number(custoTotal.toFixed(2)),
    },
  });
});

router.get('/ultimas/:ambienteId', async (req, res) => {
  const resultado = await comTransacao(async (client) => {
    const r = await client.query(
      `SELECT * FROM sensores
       WHERE user_id = $1 AND ambiente_id = $2
       ORDER BY data DESC
       LIMIT 50`,
      [req.userId, req.params.ambienteId]
    );
    return r.rows;
  });
  return res.json(resultado.map(reduzirSensor));
});

export default router;