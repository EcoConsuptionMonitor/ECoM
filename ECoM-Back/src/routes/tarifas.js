import { Router } from 'express';
import store from '../data/store.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.use(autenticar);

router.get('/', (req, res) => {
  const itens = store.tarifas.filter((t) => t.userId === req.userId);
  return res.json(itens);
});

router.post('/', (req, res) => {
  const { tipo, valorPorUnidade, nome } = req.body || {};

  if (!tipo || valorPorUnidade == null) {
    return res.status(400).json({ erro: 'Campos obrigatórios: tipo e valorPorUnidade.' });
  }
  if (!['agua', 'energia'].includes(tipo)) {
    return res.status(400).json({ erro: 'O campo tipo deve ser "agua" ou "energia".' });
  }

  const existente = store.tarifas.find(
    (t) => t.userId === req.userId && t.tipo === tipo
  );
  if (existente) {
    existente.valorPorUnidade = Number(valorPorUnidade);
    existente.nome = nome || existente.nome;
    existente.atualizadoEm = new Date().toISOString();
    return res.json(existente);
  }

  const tarifa = {
    id: store.nextId(),
    userId: req.userId,
    tipo,
    nome: nome || (tipo === 'agua' ? 'Tarifa de Água' : 'Tarifa de Energia'),
    valorPorUnidade: Number(valorPorUnidade),
    unidade: tipo === 'agua' ? 'R$/m³' : 'R$/kWh',
    criadoEm: new Date().toISOString(),
  };

  store.tarifas.push(tarifa);
  return res.status(201).json(tarifa);
});

router.delete('/:id', (req, res) => {
  const index = store.tarifas.findIndex(
    (t) => t.id === req.params.id && t.userId === req.userId
  );
  if (index === -1) {
    return res.status(404).json({ erro: 'Tarifa não encontrada.' });
  }
  store.tarifas.splice(index, 1);
  return res.status(204).send();
});

export default router;
