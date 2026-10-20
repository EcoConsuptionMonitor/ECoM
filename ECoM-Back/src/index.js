import 'dotenv/config';
import app from './app.js';
import { initDb, query } from './lib/db.js';
import { hashSenha } from './middleware/auth.js';

const PORT = process.env.PORT || 3333;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ecom.com';
const ADMIN_SENHA = process.env.ADMIN_SENHA || 'admin123';

async function criarAdmin() {
  const existente = await query('SELECT id FROM usuarios WHERE email = $1', [
    ADMIN_EMAIL,
  ]);
  if (existente.rowCount > 0) return;
  await query(
    'INSERT INTO usuarios (nome, email, telefone, senha) VALUES ($1, $2, $3, $4)',
    ['Administrador', ADMIN_EMAIL, null, hashSenha(ADMIN_SENHA)]
  );
  console.log(`Usuário admin criado: ${ADMIN_EMAIL} / ${ADMIN_SENHA}`);
}

async function iniciar() {
  try {
    await initDb();
    await criarAdmin();
    console.log('Banco de dados conectado (Neon/PostgreSQL).');
    app.listen(PORT, () => {
      console.log(`ECoM API ouvindo em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Falha ao conectar ao banco de dados:');
    console.error(err);
    process.exit(1);
  }
}

iniciar();