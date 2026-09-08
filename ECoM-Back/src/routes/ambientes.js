import { Router } from 'express';
import store from '../data/store.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.use(autenticar);

router.get('/', (req, res) => {
  const itens = store.ambientes.filter((a) => a.userId === req.userId);
  const result = itens.map((amb) => {
    const registros = store.consumo.filter((c) => c.ambienteId === amb.id);
    return {
      ...amb,
      totalAgua: registros.filter((c) => c.tipo === 'agua').reduce((a, c) => a + c.valor, 0),
      totalEnergia: registros.filter((c) => c.tipo === 'energia').reduce((a, c) => a + c.valor, 0),
      totalRegistros: registros.length,
    };
  });
  return res.json(result);
});

router.get('/:id', (req, res) => {
  const ambiente = store.ambientes.find(
    (a) => a.id === req.params.id && a.userId === req.userId
  );
  if (!ambiente) {
    return res.status(404).json({ erro: 'Ambiente não encontrado.' });
  }

  const registros = store.consumo
    .filter((c) => c.ambienteId === ambiente.id)
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  const totalAgua = registros.filter((c) => c.tipo === 'agua').reduce((a, c) => a + c.valor, 0);
  const totalEnergia = registros.filter((c) => c.tipo === 'energia').reduce((a, c) => a + c.valor, 0);

  return res.json({
    ...ambiente,
    totalAgua,
    totalEnergia,
    registros,
  });
});

router.post('/', (req, res) => {
  const { nome, localizacao, descricao } = req.body || {};

  if (!nome) {
    return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
  }

  const ambiente = {
    id: store.nextId(),
    userId: req.userId,
    nome,
    localizacao: localizacao || null,
    descricao: descricao || null,
    criadoEm: new Date().toISOString(),
  };

  store.ambientes.push(ambiente);
  return res.status(201).json(ambiente);
});

router.patch('/:id', (req, res) => {
  const ambiente = store.ambientes.find(
    (a) => a.id === req.params.id && a.userId === req.userId
  );
  if (!ambiente) {
    return res.status(404).json({ erro: 'Ambiente não encontrado.' });
  }

  const { nome, localizacao, descricao } = req.body || {};
  if (nome != null) ambiente.nome = nome;
  if (localizacao != null) ambiente.localizacao = localizacao;
  if (descricao != null) ambiente.descricao = descricao;

  return res.json(ambiente);
});

router.delete('/:id', (req, res) => {
  const index = store.ambientes.findIndex(
    (a) => a.id === req.params.id && a.userId === req.userId
  );
  if (index === -1) {
    return res.status(404).json({ erro: 'Ambiente não encontrado.' });
  }
  store.ambientes.splice(index, 1);
  return res.status(204).send();
});

export default router;
