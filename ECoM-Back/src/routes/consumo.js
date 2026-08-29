import { Router } from 'express';
import store from '../data/store.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.use(autenticar);

router.get('/', (req, res) => {
  const { tipo, ambienteId } = req.query;

  let itens = store.consumo.filter((c) => c.userId === req.userId);

  if (tipo) {
    itens = itens.filter((c) => c.tipo === tipo);
  }
  if (ambienteId) {
    itens = itens.filter((c) => c.ambienteId === ambienteId);
  }

  itens = itens.sort((a, b) => new Date(b.data) - new Date(a.data));

  return res.json(itens);
});

router.post('/', (req, res) => {
  const { ambienteId, tipo, valor, unidade, data } = req.body || {};

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

  const registro = {
    id: store.nextId(),
    userId: req.userId,
    ambienteId,
    tipo,
    valor: Number(valor),
    unidade: unidade || (tipo === 'agua' ? 'L' : 'kWh'),
    data: data || new Date().toISOString(),
  };

  if (Number.isNaN(registro.valor)) {
    return res.status(400).json({ erro: 'O campo valor deve ser numérico.' });
  }

  store.consumo.push(registro);
  return res.status(201).json(registro);
});

export default router;
