import { Router } from 'express';
import store from '../data/store.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.use(autenticar);

router.get('/', (req, res) => {
  const itens = store.sensores.filter((s) => s.userId === req.userId);
  return res.json(itens);
});

router.post('/', (req, res) => {
  const { ambienteId, tipo, valor, unidade, potencia, corrente, tensao } = req.body || {};

  if (!ambienteId || !tipo || valor == null) {
    return res.status(400).json({ erro: 'Campos obrigatórios: ambienteId, tipo e valor.' });
  }
  if (!['agua', 'energia'].includes(tipo)) {
    return res.status(400).json({ erro: 'O campo tipo deve ser "agua" ou "energia".' });
  }

  const ambiente = store.ambientes.find(
    (a) => a.id === ambienteId && a.userId === req.userId
  );
  if (!ambiente) {
    return res.status(404).json({ erro: 'Ambiente não encontrado para este usuário.' });
  }

  const leitura = {
    id: store.nextId(),
    userId: req.userId,
    ambienteId,
    tipo,
    valor: Number(valor),
    unidade: unidade || (tipo === 'agua' ? 'L/min' : 'A'),
    potencia: potencia != null ? Number(potencia) : null,
    corrente: corrente != null ? Number(corrente) : null,
    tensao: tensao != null ? Number(tensao) : null,
    data: new Date().toISOString(),
  };

  store.sensores.push(leitura);

  const registroConsumo = {
    id: store.nextId(),
    userId: req.userId,
    ambienteId,
    tipo,
    valor: tipo === 'agua' ? Number(valor) : Number(valor),
    unidade: tipo === 'agua' ? 'L' : 'kWh',
    fonte: 'sensor',
    data: new Date().toISOString(),
  };
  store.consumo.push(registroConsumo);

  const userConsumo = store.consumo.filter((c) => c.userId === req.userId && c.tipo === tipo);
  const total = userConsumo.reduce((acc, c) => acc + c.valor, 0);
  const userTarifas = store.tarifas.filter((t) => t.userId === req.userId);
  const tarifa = userTarifas.find((t) => t.tipo === tipo);
  const valorPorUnidade = tarifa ? tarifa.valorPorUnidade : (tipo === 'agua' ? 5.82 : 0.65);
  const fator = tipo === 'agua' ? 1 / 1000 : 1;
  const custoTotal = total * fator * valorPorUnidade;

  if (tipo === 'energia' && valor > 5) {
    const jaExiste = store.alertas.some(
      (a) => a.userId === req.userId && a.tipo === tipo && !a.lido && a.mensagem.includes('elevado')
    );
    if (!jaExiste) {
      store.alertas.push({
        id: store.nextId(),
        userId: req.userId,
        mensagem: `Consumo elevado de energia detectado: ${valor} ${leitura.unidade}`,
        nivel: 'critico',
        tipo,
        lido: false,
        data: new Date().toISOString(),
      });
    }
  }

  return res.status(201).json({
    leitura,
    registro: registroConsumo,
    totais: {
      consumoTotal: total,
      custoTotal: Number(custoTotal.toFixed(2)),
    },
  });
});

router.get('/ultimas/:ambienteId', (req, res) => {
  const itens = store.sensores
    .filter((s) => s.userId === req.userId && s.ambienteId === req.params.ambienteId)
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 50);
  return res.json(itens);
});

export default router;
