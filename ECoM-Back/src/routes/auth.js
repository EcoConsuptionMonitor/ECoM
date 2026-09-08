import { Router } from 'express';
import store from '../data/store.js';
import { autenticar, criarToken, hashSenha, verificarSenha } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { nome, email, telefone, senha } = req.body || {};

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, email e senha.' });
  }

  const jaExiste = store.usuarios.some((u) => u.email === email);
  if (jaExiste) {
    return res.status(409).json({ erro: 'Já existe um usuário com este email.' });
  }

  const usuario = {
    id: store.nextId(),
    nome,
    email,
    telefone: telefone || null,
    senha: hashSenha(senha),
    criadoEm: new Date().toISOString(),
  };

  store.usuarios.push(usuario);

  const token = criarToken(usuario.id);
  return res.status(201).json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  });
});

router.post('/login', (req, res) => {
  const { email, senha } = req.body || {};

  const usuario = store.usuarios.find((u) => u.email === email);
  if (!usuario || !verificarSenha(senha || '', usuario.senha)) {
    return res.status(401).json({ erro: 'Email ou senha inválidos.' });
  }

  const token = criarToken(usuario.id);
  return res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  });
});

router.get('/me', autenticar, (req, res) => {
  const usuario = store.usuarios.find((u) => u.id === req.userId);
  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }

  return res.json({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
  });
});

export default router;
