import { Router } from 'express';
import { query, reduzirAmbiente, reduzirConsumo } from '../lib/db.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  const resultado = await query(
    `SELECT a.*,
       COALESCE(SUM(c.valor) FILTER (WHERE c.tipo = 'agua'), 0) AS total_agua,
       COALESCE(SUM(c.valor) FILTER (WHERE c.tipo = 'energia'), 0) AS total_energia,
       COUNT(c.id) AS total_registros
     FROM ambientes a
     LEFT JOIN consumo c ON c.ambiente_id = a.id
     WHERE a.user_id = $1
     GROUP BY a.id
     ORDER BY a.id`,
    [req.userId]
  );

  const result = resultado.rows.map((amb) => ({
    ...reduzirAmbiente(amb),
    totalAgua: Number(amb.total_agua),
    totalEnergia: Number(amb.total_energia),
    totalRegistros: Number(amb.total_registros),
  }));

  return res.json(result);
});

router.get('/:id', async (req, res) => {
  const ambienteResult = await query(
    'SELECT * FROM ambientes WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (ambienteResult.rowCount === 0) {
    return res.status(404).json({ erro: 'Ambiente não encontrado.' });
  }

  const registrosResult = await query(
    `SELECT * FROM consumo
     WHERE ambiente_id = $1
     ORDER BY data DESC`,
    [req.params.id]
  );

  const registros = registrosResult.rows.map(reduzirConsumo);
  const totalAgua = registros
    .filter((c) => c.tipo === 'agua')
    .reduce((a, c) => a + c.valor, 0);
  const totalEnergia = registros
    .filter((c) => c.tipo === 'energia')
    .reduce((a, c) => a + c.valor, 0);

  return res.json({
    ...reduzirAmbiente(ambienteResult.rows[0]),
    totalAgua,
    totalEnergia,
    registros,
  });
});

router.post('/', async (req, res) => {
  const { nome, localizacao, descricao } = req.body || {};

  if (!nome) {
    return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
  }

  const inserido = await query(
    `INSERT INTO ambientes (user_id, nome, localizacao, descricao)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [req.userId, nome, localizacao || null, descricao || null]
  );

  return res.status(201).json(reduzirAmbiente(inserido.rows[0]));
});

router.patch('/:id', async (req, res) => {
  const ambienteResult = await query(
    'SELECT * FROM ambientes WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (ambienteResult.rowCount === 0) {
    return res.status(404).json({ erro: 'Ambiente não encontrado.' });
  }

  const atual = ambienteResult.rows[0];
  const { nome, localizacao, descricao } = req.body || {};

  const atualizado = await query(
    `UPDATE ambientes
     SET nome = $1, localizacao = $2, descricao = $3
     WHERE id = $4
     RETURNING *`,
    [
      nome != null ? nome : atual.nome,
      localizacao != null ? localizacao : atual.localizacao,
      descricao != null ? descricao : atual.descricao,
      req.params.id,
    ]
  );

  return res.json(reduzirAmbiente(atualizado.rows[0]));
});

router.delete('/:id', async (req, res) => {
  const resultado = await query(
    'DELETE FROM ambientes WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (resultado.rowCount === 0) {
    return res.status(404).json({ erro: 'Ambiente não encontrado.' });
  }
  return res.status(204).send();
});

export default router;