import { Router } from 'express';
import { query, reduzirConsumo } from '../lib/db.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  const { tipo, ambienteId } = req.query;

  const filtros = ['c.user_id = $1'];
  const params = [req.userId];
  if (tipo) {
    params.push(tipo);
    filtros.push(`c.tipo = $${params.length}`);
  }
  if (ambienteId) {
    params.push(ambienteId);
    filtros.push(`c.ambiente_id = $${params.length}`);
  }

  const resultado = await query(
    `SELECT * FROM consumo c
     WHERE ${filtros.join(' AND ')}
     ORDER BY c.data DESC`,
    params
  );

  return res.json(resultado.rows.map(reduzirConsumo));
});

router.post('/', async (req, res) => {
  const { ambienteId, tipo, valor, unidade, data } = req.body || {};

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

  const ambiente = await query(
    'SELECT id FROM ambientes WHERE id = $1 AND user_id = $2',
    [ambienteId, req.userId]
  );
  if (ambiente.rowCount === 0) {
    return res
      .status(404)
      .json({ erro: 'Ambiente não encontrado para este usuário.' });
  }

  const inserido = await query(
    `INSERT INTO consumo (user_id, ambiente_id, tipo, valor, unidade, data)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      req.userId,
      ambienteId,
      tipo,
      valorNumerico,
      unidade || (tipo === 'agua' ? 'L' : 'kWh'),
      data || new Date().toISOString(),
    ]
  );

  return res.status(201).json(reduzirConsumo(inserido.rows[0]));
});

export default router;