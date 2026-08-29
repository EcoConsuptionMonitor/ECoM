import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import store from '../data/store.js';

export function hashSenha(senha) {
  return createHash('sha256').update(senha).digest('hex');
}

export function criarToken(userId) {
  const token = randomBytes(32).toString('hex');
  store.sessoes.push({ token, userId });
  return token;
}

export function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
  }

  const sessao = store.sessoes.find((s) => s.token === token);
  if (!sessao) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }

  req.userId = sessao.userId;
  return next();
}

export function verificarSenha(senha, hash) {
  const a = Buffer.from(hashSenha(senha));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
