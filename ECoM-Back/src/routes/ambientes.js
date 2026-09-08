import { Router } from 'express';
import store from '../data/store.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.use(autenticar);

router.get('/', (req, res) => {
  const itens = store.ambientes.filter((a) => a.userId === req.userId);
  return res.json(itens);
});

router.post('/', (req, res) => {
  const { nome, localizacao } = req.body || {};

  if (!nome) {
    return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
  }

  const ambiente = {
    id: store.nextId(),
    userId: req.userId,
    nome,
    localizacao: localizacao || null,
    criadoEm: new Date().toISOString(),
  };

  store.ambientes.push(ambiente);
  return res.status(201).json(ambiente);
});

export default router;
