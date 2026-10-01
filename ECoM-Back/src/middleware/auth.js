import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { query } from '../lib/db.js';

export function hashSenha(senha) {
  return createHash('sha256').update(senha).digest('hex');
}

export async function criarToken(userId) {
  const token = randomBytes(32).toString('hex');
  await query('INSERT INTO sessoes (token, user_id) VALUES ($1, $2)', [
    token,
    userId,
  ]);
  return token;
}

export async function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
  }

  const resultado = await query('SELECT user_id FROM sessoes WHERE token = $1', [
    token,
  ]);
  if (resultado.rowCount === 0) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }

  req.userId = Number(resultado.rows[0].user_id);
  return next();
}

export function verificarSenha(senha, hash) {
  const a = Buffer.from(hashSenha(senha));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}