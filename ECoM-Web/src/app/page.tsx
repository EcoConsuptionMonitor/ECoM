"use client";

import { useState } from "react";

const API_URL = "http://localhost:3333";

type Consumo = {
  id: string;
  tipo: "agua" | "energia";
  valor: number;
  unidade: string;
  data: string;
};

type Alerta = {
  id: string;
  mensagem: string;
  nivel: "info" | "alerta" | "critico";
  tipo: string;
  lido: boolean;
  data: string;
};

async function api<T>(
  path: string,
  { method = "GET", body, token }: { method?: string; body?: unknown; token?: string } = {}
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.erro) || `Erro ${res.status}`);
  return data as T;
}

export default function Home() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("ecom_token");
  });
  const [nome, setNome] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("ecom_nome");
  });

  const [modal, setModal] = useState<"login" | "registro" | null>(token ? null : "login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeReg, setNomeReg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [consumo, setConsumo] = useState<Consumo[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  async function autenticar() {
    setErro("");
    setCarregando(true);
    try {
      const path = modal === "registro" ? "/auth/register" : "/auth/login";
      const body = modal === "registro"
        ? { nome: nomeReg, email, telefone, senha }
        : { email, senha };
      const data = await api<{ token: string; usuario: { nome: string } }>(path, {
        method: "POST",
        body,
      });
      window.localStorage.setItem("ecom_token", data.token);
      window.localStorage.setItem("ecom_nome", data.usuario.nome);
      setToken(data.token);
      setNome(data.usuario.nome);
      setModal(null);
      carregarDados(data.token);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao autenticar.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarDados(authToken: string) {
    try {
      const [c, a] = await Promise.all([
        api<Consumo[]>("/consumo", { token: authToken }),
        api<Alerta[]>("/alertas", { token: authToken }),
      ]);
      setConsumo(c);
      setAlertas(a);
    } catch {
      // dados opcionais; sem token válido mantém vazio
    }
  }

  function sair() {
    window.localStorage.removeItem("ecom_token");
    window.localStorage.removeItem("ecom_nome");
    setToken(null);
    setNome(null);
    setModal("login");
    setConsumo([]);
    setAlertas([]);
  }

  const totalEnergia = consumo
    .filter((c) => c.tipo === "energia")
    .reduce((acc, c) => acc + Number(c.valor), 0);
  const totalAgua = consumo
    .filter((c) => c.tipo === "agua")
    .reduce((acc, c) => acc + Number(c.valor), 0);
  const alertasAtivos = alertas.filter((a) => !a.lido);
  const nivelCor = (n: string) =>
    n === "critico" ? "#ff5252" : n === "alerta" ? "#ffc107" : "#69f0ae";

  const inputCls =
    "w-full rounded-lg bg-black/5 dark:bg-white/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
      {!token ? (
        <main className="flex min-h-full flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900">
            <h1 className="mb-1 text-2xl font-bold text-black dark:text-zinc-50">
              {modal === "registro" ? "Criar conta" : "Entrar"}
            </h1>
            <p className="mb-6 text-sm text-zinc-500">
              Controle de consumo de água e energia da casa.
            </p>

            {modal === "registro" && (
              <div className="mb-3">
                <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Nome</label>
                <input className={inputCls} value={nomeReg} onChange={(e) => setNomeReg(e.target.value)} />
              </div>
            )}
            <div className="mb-3">
              <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Email</label>
              <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {modal === "registro" && (
              <div className="mb-3">
                <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Telefone</label>
                <input className={inputCls} value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
            )}
            <div className="mb-4">
              <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Senha</label>
              <input className={inputCls} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>

            {erro && <p className="mb-3 text-sm text-red-500">{erro}</p>}

            <button
              onClick={autenticar}
              disabled={carregando}
              className="w-full rounded-full bg-emerald-700 px-5 py-2.5 font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
            >
              {carregando ? "Aguarde..." : modal === "registro" ? "Cadastrar" : "Entrar"}
            </button>
            <button
              onClick={() => {
                setModal(modal === "registro" ? "login" : "registro");
                setErro("");
              }}
              className="mt-3 w-full text-center text-sm text-zinc-500 hover:underline"
            >
              {modal === "registro" ? "Já tem conta? Entrar" : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-5xl p-6">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-zinc-50">Olá, {nome}!</h1>
              <p className="text-sm text-zinc-500">Painel ECoM — controle de água e energia</p>
            </div>
            <button
              onClick={sair}
              className="rounded-full border border-black/10 px-4 py-1.5 text-sm dark:border-white/15 dark:text-zinc-200"
            >
              Sair
            </button>
          </header>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Energia</p>
              <p className="mt-1 text-3xl font-bold text-black dark:text-zinc-50">{totalEnergia} kWh</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Água</p>
              <p className="mt-1 text-3xl font-bold text-black dark:text-zinc-50">{totalAgua} L</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Custo Total</p>
              <p className="mt-1 text-3xl font-bold text-black dark:text-zinc-50">
                R$ {(totalAgua + totalEnergia).toFixed(2)}
              </p>
            </div>
          </div>

          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-black dark:text-zinc-50">Alertas recentes</h2>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/40 dark:text-red-300">
                {alertasAtivos.length} ativo(s)
              </span>
            </div>
            {alertas.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhum alerta por enquanto.</p>
            ) : (
              <ul className="space-y-2">
                {alertas.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: nivelCor(a.nivel) }} />
                    <span className="text-black dark:text-zinc-100">{a.mensagem}</span>
                    <span className="ml-auto text-xs text-zinc-400">
                      {new Date(a.data).toLocaleString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
            <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">Consumo registrado</h2>
            {consumo.length === 0 ? (
              <p className="text-sm text-zinc-500">Sem registros de consumo ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/10 text-left text-zinc-500 dark:border-white/10">
                      <th className="pb-2 pr-4">Tipo</th>
                      <th className="pb-2 pr-4">Valor</th>
                      <th className="pb-2">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumo.map((c) => (
                      <tr key={c.id} className="border-b border-black/5 dark:border-white/5">
                        <td className="py-2 pr-4 text-black dark:text-zinc-100">{c.tipo}</td>
                        <td className="py-2 pr-4 text-black dark:text-zinc-100">
                          {c.valor} {c.unidade}
                        </td>
                        <td className="py-2 text-zinc-500">
                          {new Date(c.data).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
