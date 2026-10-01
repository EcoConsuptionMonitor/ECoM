import 'dotenv/config';
import app from './app.js';
import { initDb } from './lib/db.js';

const PORT = process.env.PORT || 3333;

async function iniciar() {
  try {
    await initDb();
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