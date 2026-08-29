import { Router } from 'express';
import store from '../data/store.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.use(autenticar);

router.get('/', (req, res) => {
  const itens = store.alertas
    .filter((a) => a.userId === req.userId)
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  return res.json(itens);
});

router.post('/', (req, res) => {
  const { mensagem, nivel, tipo } = req.body || {};

  if (!mensagem) {
    return res.status(400).json({ erro: 'O campo mensagem é obrigatório.' });
  }

  const niveisValidos = ['info', 'alerta', 'critico'];
  if (nivel && !niveisValidos.includes(nivel)) {
    return res.status(400).json({ erro: `Nível deve ser um de: ${niveisValidos.join(', ')}.` });
  }

  const alerta = {
    id: store.nextId(),
    userId: req.userId,
    mensagem,
    nivel: nivel || 'info',
    tipo: tipo || 'geral',
    lido: false,
    data: new Date().toISOString(),
  };

  store.alertas.push(alerta);
  return res.status(201).json(alerta);
});

router.patch('/:id', (req, res) => {
  const alerta = store.alertas.find((a) => a.id === req.params.id && a.userId === req.userId);
  if (!alerta) {
    return res.status(404).json({ erro: 'Alerta não encontrado.' });
  }

  if (req.body && typeof req.body.lido === 'boolean') {
    alerta.lido = req.body.lido;
  }

  return res.json(alerta);
});

export default router;
