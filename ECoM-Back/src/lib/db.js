import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === 'false'
      ? false
      : { rejectUnauthorized: false },
});

export const query = (text, params) => pool.query(text, params);

export async function comTransacao(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await callback(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const iso = (valor) => (valor ? new Date(valor).toISOString() : null);

export const reduzirUsuario = (r) => ({
  id: String(r.id),
  nome: r.nome,
  email: r.email,
  telefone: r.telefone,
  senha: r.senha,
  criadoEm: iso(r.criado_em),
});

export const reduzirAmbiente = (r) => ({
  id: String(r.id),
  userId: String(r.user_id),
  nome: r.nome,
  localizacao: r.localizacao,
  descricao: r.descricao,
  criadoEm: iso(r.criado_em),
});

export const reduzirConsumo = (r) => ({
  id: String(r.id),
  userId: String(r.user_id),
  ambienteId: String(r.ambiente_id),
  tipo: r.tipo,
  valor: Number(r.valor),
  unidade: r.unidade,
  fonte: r.fonte,
  data: iso(r.data),
});

export const reduzirAlerta = (r) => ({
  id: String(r.id),
  userId: String(r.user_id),
  mensagem: r.mensagem,
  nivel: r.nivel,
  tipo: r.tipo,
  lido: r.lido,
  data: iso(r.data),
});

export const reduzirTarifa = (r) => ({
  id: String(r.id),
  userId: String(r.user_id),
  tipo: r.tipo,
  nome: r.nome,
  valorPorUnidade: Number(r.valor_por_unidade),
  unidade: r.unidade,
  criadoEm: iso(r.criado_em),
  atualizadoEm: iso(r.atualizado_em),
});

export const reduzirSensor = (r) => ({
  id: String(r.id),
  userId: String(r.user_id),
  ambienteId: String(r.ambiente_id),
  tipo: r.tipo,
  valor: Number(r.valor),
  unidade: r.unidade,
  potencia: r.potencia != null ? Number(r.potencia) : null,
  corrente: r.corrente != null ? Number(r.corrente) : null,
  tensao: r.tensao != null ? Number(r.tensao) : null,
  data: iso(r.data),
});

export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      telefone TEXT,
      senha TEXT NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessoes (
      id SERIAL PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ambientes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      localizacao TEXT,
      descricao TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS consumo (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      ambiente_id INTEGER REFERENCES ambientes(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL CHECK (tipo IN ('agua', 'energia')),
      valor DOUBLE PRECISION NOT NULL,
      unidade TEXT,
      fonte TEXT NOT NULL DEFAULT 'manual',
      data TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS alertas (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      mensagem TEXT NOT NULL,
      nivel TEXT NOT NULL DEFAULT 'info',
      tipo TEXT NOT NULL DEFAULT 'geral',
      lido BOOLEAN NOT NULL DEFAULT false,
      data TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS tarifas (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL CHECK (tipo IN ('agua', 'energia')),
      nome TEXT,
      valor_por_unidade DOUBLE PRECISION NOT NULL,
      unidade TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
      atualizado_em TIMESTAMPTZ,
      UNIQUE (user_id, tipo)
    );

    CREATE TABLE IF NOT EXISTS sensores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      ambiente_id INTEGER NOT NULL REFERENCES ambientes(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL CHECK (tipo IN ('agua', 'energia')),
      valor DOUBLE PRECISION NOT NULL,
      unidade TEXT,
      potencia DOUBLE PRECISION,
      corrente DOUBLE PRECISION,
      tensao DOUBLE PRECISION,
      data TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes(token);
    CREATE INDEX IF NOT EXISTS idx_ambientes_user ON ambientes(user_id);
    CREATE INDEX IF NOT EXISTS idx_consumo_user_data ON consumo(user_id, data);
    CREATE INDEX IF NOT EXISTS idx_alertas_user ON alertas(user_id);
    CREATE INDEX IF NOT EXISTS idx_tarifas_user ON tarifas(user_id);
    CREATE INDEX IF NOT EXISTS idx_sensores_user_ambiente ON sensores(user_id, ambiente_id);
  `);
}

export default pool;