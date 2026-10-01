import { Router } from 'express';
import { query, reduzirUsuario } from '../lib/db.js';
import {
  autenticar,
  criarToken,
  hashSenha,
  verificarSenha,
} from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { nome, email, telefone, senha } = req.body || {};

  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ erro: 'Campos obrigatórios: nome, email e senha.' });
  }

  const existente = await query('SELECT id FROM usuarios WHERE email = $1', [
    email,
  ]);
  if (existente.rowCount > 0) {
    return res.status(409).json({ erro: 'Já existe um usuário com este email.' });
  }

  const inserido = await query(
    `INSERT INTO usuarios (nome, email, telefone, senha)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nome, email, telefone, criado_em`,
    [nome, email, telefone || null, hashSenha(senha)]
  );

  const usuario = reduzirUsuario(inserido.rows[0]);
  const token = await criarToken(usuario.id);

  return res.status(201).json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  });
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};

  const resultado = await query(
    'SELECT id, nome, email, telefone, senha, criado_em FROM usuarios WHERE email = $1',
    [email]
  );

  const usuario = resultado.rows[0] ? reduzirUsuario(resultado.rows[0]) : null;
  if (!usuario || !verificarSenha(senha || '', usuario.senha)) {
    return res.status(401).json({ erro: 'Email ou senha inválidos.' });
  }

  const token = await criarToken(usuario.id);
  return res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  });
});

router.get('/me', autenticar, async (req, res) => {
  const resultado = await query(
    'SELECT id, nome, email, telefone, criado_em FROM usuarios WHERE id = $1',
    [req.userId]
  );
  if (resultado.rowCount === 0) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }

  const usuario = reduzirUsuario(resultado.rows[0]);
  return res.json({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
  });
});

export default router;