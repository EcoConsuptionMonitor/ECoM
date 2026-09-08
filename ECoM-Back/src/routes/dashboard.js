import { Router } from 'express';
import store from '../data/store.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.use(autenticar);

router.get('/', (req, res) => {
  const userId = req.userId;

  const userConsumo = store.consumo.filter((c) => c.userId === userId);
  const userAmbientes = store.ambientes.filter((a) => a.userId === userId);
  const userAlertas = store.alertas.filter((a) => a.userId === userId);
  const userTarifas = store.tarifas.filter((t) => t.userId === userId);

  const tarifaAgua = userTarifas.find((t) => t.tipo === 'agua');
  const tarifaEnergia = userTarifas.find((t) => t.tipo === 'energia');
  const valorAguaM3 = tarifaAgua ? tarifaAgua.valorPorUnidade : 5.82;
  const valorEnergiaKwh = tarifaEnergia ? tarifaEnergia.valorPorUnidade : 0.65;

  const totalAgua = userConsumo
    .filter((c) => c.tipo === 'agua')
    .reduce((acc, c) => acc + c.valor, 0);

  const totalEnergia = userConsumo
    .filter((c) => c.tipo === 'energia')
    .reduce((acc, c) => acc + c.valor, 0);

  const custoAgua = (totalAgua / 1000) * valorAguaM3;
  const custoEnergia = totalEnergia * valorEnergiaKwh;
  const custoTotal = custoAgua + custoEnergia;

  const alertasAtivos = userAlertas.filter((a) => !a.lido).length;
  const alertasCriticos = userAlertas.filter((a) => !a.lido && a.nivel === 'critico').length;

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const consumoMes = userConsumo.filter((c) => new Date(c.data) >= inicioMes);
  const consumoMesAgua = consumoMes
    .filter((c) => c.tipo === 'agua')
    .reduce((acc, c) => acc + c.valor, 0);
  const consumoMesEnergia = consumoMes
    .filter((c) => c.tipo === 'energia')
    .reduce((acc, c) => acc + c.valor, 0);

  const consumoPorDia = {};
  userConsumo.forEach((c) => {
    const dia = c.data.slice(0, 10);
    if (!consumoPorDia[dia]) {
      consumoPorDia[dia] = { agua: 0, energia: 0 };
    }
    consumoPorDia[dia][c.tipo] += c.valor;
  });
  const historico = Object.entries(consumoPorDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([dia, val]) => ({ dia, ...val }));

  const consumoPorAmbiente = userAmbientes.map((amb) => {
    const registros = userConsumo.filter((c) => c.ambienteId === amb.id);
    return {
      ambienteId: amb.id,
      nome: amb.nome,
      agua: registros.filter((c) => c.tipo === 'agua').reduce((a, c) => a + c.valor, 0),
      energia: registros.filter((c) => c.tipo === 'energia').reduce((a, c) => a + c.valor, 0),
    };
  });

  const alertasRecentes = userAlertas
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 10);

  return res.json({
    totais: {
      agua: totalAgua,
      energia: totalEnergia,
      custoAgua: Number(custoAgua.toFixed(2)),
      custoEnergia: Number(custoEnergia.toFixed(2)),
      custoTotal: Number(custoTotal.toFixed(2)),
    },
    mes: {
      agua: consumoMesAgua,
      energia: consumoMesEnergia,
    },
    alertas: {
      ativos: alertasAtivos,
      criticos: alertasCriticos,
    },
    ambientes: userAmbientes.length,
    historico,
    consumoPorAmbiente,
    alertasRecentes,
    tarifas: {
      agua: valorAguaM3,
      energia: valorEnergiaKwh,
    },
  });
});

export default router;
