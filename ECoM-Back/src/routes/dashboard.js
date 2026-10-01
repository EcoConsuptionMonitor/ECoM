import { Router } from 'express';
import { query, reduzirAlerta } from '../lib/db.js';
import { autenticar } from '../middleware/auth.js';
import { obterTarifas } from '../lib/tarifas.js';

const router = Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  const userId = req.userId;

  const tarifas = await obterTarifas(userId);
  const valorAguaM3 = tarifas.agua;
  const valorEnergiaKwh = tarifas.energia;

  const [totais, mes, alertas, historico, consumoPorAmbiente, alertasRecentes] =
    await Promise.all([
      query(
        `SELECT
           COALESCE(SUM(valor) FILTER (WHERE tipo = 'agua'), 0) AS agua,
           COALESCE(SUM(valor) FILTER (WHERE tipo = 'energia'), 0) AS energia
         FROM consumo WHERE user_id = $1`,
        [userId]
      ),
      query(
        `SELECT
           COALESCE(SUM(valor) FILTER (WHERE tipo = 'agua'), 0) AS agua,
           COALESCE(SUM(valor) FILTER (WHERE tipo = 'energia'), 0) AS energia
         FROM consumo
         WHERE user_id = $1
           AND data >= date_trunc('month', now())`,
        [userId]
      ),
      query(
        `SELECT
           COUNT(*) FILTER (WHERE NOT lido) AS ativos,
           COUNT(*) FILTER (WHERE NOT lido AND nivel = 'critico') AS criticos
         FROM alertas WHERE user_id = $1`,
        [userId]
      ),
      query(
        `SELECT
           to_char(data, 'YYYY-MM-DD') AS dia,
           COALESCE(SUM(valor) FILTER (WHERE tipo = 'agua'), 0) AS agua,
           COALESCE(SUM(valor) FILTER (WHERE tipo = 'energia'), 0) AS energia
         FROM consumo
         WHERE user_id = $1
         GROUP BY to_char(data, 'YYYY-MM-DD')
         ORDER BY dia DESC
         LIMIT 30`,
        [userId]
      ),
      query(
        `SELECT
           a.id AS ambiente_id,
           a.nome,
           COALESCE(SUM(c.valor) FILTER (WHERE c.tipo = 'agua'), 0) AS agua,
           COALESCE(SUM(c.valor) FILTER (WHERE c.tipo = 'energia'), 0) AS energia
         FROM ambientes a
         LEFT JOIN consumo c ON c.ambiente_id = a.id
         WHERE a.user_id = $1
         GROUP BY a.id, a.nome
         ORDER BY a.id`,
        [userId]
      ),
      query(
        `SELECT * FROM alertas
         WHERE user_id = $1
         ORDER BY data DESC
         LIMIT 10`,
        [userId]
      ),
    ]);

  const totalAgua = Number(totais.rows[0].agua);
  const totalEnergia = Number(totais.rows[0].energia);

  const custoAgua = (totalAgua / 1000) * valorAguaM3;
  const custoEnergia = totalEnergia * valorEnergiaKwh;
  const custoTotal = custoAgua + custoEnergia;

  return res.json({
    totais: {
      agua: totalAgua,
      energia: totalEnergia,
      custoAgua: Number(custoAgua.toFixed(2)),
      custoEnergia: Number(custoEnergia.toFixed(2)),
      custoTotal: Number(custoTotal.toFixed(2)),
    },
    mes: {
      agua: Number(mes.rows[0].agua),
      energia: Number(mes.rows[0].energia),
    },
    alertas: {
      ativos: Number(alertas.rows[0].ativos),
      criticos: Number(alertas.rows[0].criticos),
    },
    ambientes: Number(consumoPorAmbiente.rowCount),
    historico: historico.rows
      .reverse()
      .map((r) => ({ dia: r.dia, agua: Number(r.agua), energia: Number(r.energia) })),
    consumoPorAmbiente: consumoPorAmbiente.rows.map((r) => ({
      ambienteId: String(r.ambiente_id),
      nome: r.nome,
      agua: Number(r.agua),
      energia: Number(r.energia),
    })),
    alertasRecentes: alertasRecentes.rows.map(reduzirAlerta),
    tarifas: {
      agua: valorAguaM3,
      energia: valorEnergiaKwh,
    },
  });
});

export default router;