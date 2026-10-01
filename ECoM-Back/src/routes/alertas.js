import { Router } from 'express';
import { query, reduzirAlerta } from '../lib/db.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  const resultado = await query(
    `SELECT * FROM alertas
     WHERE user_id = $1
     ORDER BY data DESC`,
    [req.userId]
  );
  return res.json(resultado.rows.map(reduzirAlerta));
});

router.post('/', async (req, res) => {
  const { mensagem, nivel, tipo } = req.body || {};

  if (!mensagem) {
    return res.status(400).json({ erro: 'O campo mensagem é obrigatório.' });
  }

  const niveisValidos = ['info', 'alerta', 'critico'];
  if (nivel && !niveisValidos.includes(nivel)) {
    return res
      .status(400)
      .json({ erro: `Nível deve ser um de: ${niveisValidos.join(', ')}.` });
  }

  const inserido = await query(
    `INSERT INTO alertas (user_id, mensagem, nivel, tipo)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [req.userId, mensagem, nivel || 'info', tipo || 'geral']
  );

  return res.status(201).json(reduzirAlerta(inserido.rows[0]));
});

router.patch('/:id', async (req, res) => {
  const alertaResult = await query(
    'SELECT * FROM alertas WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (alertaResult.rowCount === 0) {
    return res.status(404).json({ erro: 'Alerta não encontrado.' });
  }

  let lido;
  if (req.body && typeof req.body.lido === 'boolean') {
    lido = req.body.lido;
  } else {
    lido = alertaResult.rows[0].lido;
  }

  const atualizado = await query(
    'UPDATE alertas SET lido = $1 WHERE id = $2 RETURNING *',
    [lido, req.params.id]
  );

  return res.json(reduzirAlerta(atualizado.rows[0]));
});

export default router;