import { Router } from 'express';
import { query, reduzirTarifa } from '../lib/db.js';
import { autenticar } from '../middleware/auth.js';
import { TARIFAS_PADRAO } from '../lib/tarifas.js';

const router = Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  const resultado = await query('SELECT * FROM tarifas WHERE user_id = $1', [
    req.userId,
  ]);
  return res.json(resultado.rows.map(reduzirTarifa));
});

router.post('/', async (req, res) => {
  const { tipo, valorPorUnidade, nome } = req.body || {};

  if (!tipo || valorPorUnidade == null) {
    return res
      .status(400)
      .json({ erro: 'Campos obrigatórios: tipo e valorPorUnidade.' });
  }
  if (!['agua', 'energia'].includes(tipo)) {
    return res
      .status(400)
      .json({ erro: 'O campo tipo deve ser "agua" ou "energia".' });
  }
  const valor = Number(valorPorUnidade);
  if (!Number.isFinite(valor) || valor < 0) {
    return res.status(400).json({
      erro: 'O campo valorPorUnidade deve ser um número maior ou igual a zero.',
    });
  }

  const inserido = await query(
    `INSERT INTO tarifas (user_id, tipo, nome, valor_por_unidade, unidade)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, tipo)
     DO UPDATE SET valor_por_unidade = EXCLUDED.valor_por_unidade,
                   nome = EXCLUDED.nome,
                   atualizado_em = now()
     RETURNING *`,
    [
      req.userId,
      tipo,
      nome || (tipo === 'agua' ? 'Tarifa de Água' : 'Tarifa de Energia'),
      valor,
      tipo === 'agua' ? 'R$/m³' : 'R$/kWh',
    ]
  );

  return res.status(201).json(reduzirTarifa(inserido.rows[0]));
});

router.put('/', async (req, res) => {
  const { agua = TARIFAS_PADRAO.agua, energia = TARIFAS_PADRAO.energia } =
    req.body || {};
  const valores = { agua: Number(agua), energia: Number(energia) };

  if (Object.values(valores).some((v) => !Number.isFinite(v) || v < 0)) {
    return res
      .status(400)
      .json({ erro: 'As tarifas devem ser números maiores ou iguais a zero.' });
  }

  const itens = await Promise.all(
    Object.entries(valores).map(([tipo, valorPorUnidade]) =>
      query(
        `INSERT INTO tarifas (user_id, tipo, nome, valor_por_unidade, unidade)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, tipo)
         DO UPDATE SET valor_por_unidade = EXCLUDED.valor_por_unidade,
                       atualizado_em = now()
         RETURNING *`,
        [
          req.userId,
          tipo,
          tipo === 'agua' ? 'Tarifa de Água' : 'Tarifa de Energia',
          valorPorUnidade,
          tipo === 'agua' ? 'R$/m³' : 'R$/kWh',
        ]
      )
    )
  );

  return res.json(itens.flatMap((r) => r.rows.map(reduzirTarifa)));
});

router.delete('/:id', async (req, res) => {
  const resultado = await query(
    'DELETE FROM tarifas WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (resultado.rowCount === 0) {
    return res.status(404).json({ erro: 'Tarifa não encontrada.' });
  }
  return res.status(204).send();
});

export default router;