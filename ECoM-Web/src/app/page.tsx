"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import NavBar from "@/components/NavBar";
import { api, type Alerta, type DashboardData } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { token, usuario, entrar, cadastrar } = useAuth();

  const [modal, setModal] = useState<"login" | "registro" | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeReg, setNomeReg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    api<DashboardData>("/dashboard", { token })
      .then((data) => {
        if (ativo) setDados(data);
      })
      .catch(() => {
        if (ativo) setDados(null);
      })
      .finally(() => {
        if (ativo) setCarregandoDados(false);
      });
    return () => {
      ativo = false;
    };
  }, [token]);

  async function autenticar() {
    setErro("");
    setCarregando(true);
    try {
      if (modal === "registro") {
        await cadastrar({ nome: nomeReg, email, telefone, senha });
      } else {
        await entrar(email, senha);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao autenticar.");
    } finally {
      setCarregando(false);
    }
  }

  function formatarCusto(valor: number) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const nivelCor = (n: string) =>
    n === "critico" ? "#ff5252" : n === "alerta" ? "#ffc107" : "#69f0ae";

  const inputCls =
    "w-full rounded-lg bg-black/20 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[#c8ff00]";

  if (!token) {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-black p-8 shadow-lg">
          <h1 className="mb-1 text-2xl font-bold text-white">
            {modal === "registro" ? "Criar conta" : "Entrar no ECoM"}
          </h1>
          <p className="mb-6 text-sm text-white/50">
            Controle de consumo de água e energia da sua casa.
          </p>

          {modal === "registro" && (
            <div className="mb-3">
              <label className="mb-1 block text-sm text-white/60">Nome</label>
              <input className={inputCls} value={nomeReg} onChange={(e) => setNomeReg(e.target.value)} />
            </div>
          )}
          <div className="mb-3">
            <label className="mb-1 block text-sm text-white/60">Email</label>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {modal === "registro" && (
            <div className="mb-3">
              <label className="mb-1 block text-sm text-white/60">Telefone</label>
              <input className={inputCls} value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
          )}
          <div className="mb-4">
            <label className="mb-1 block text-sm text-white/60">Senha</label>
            <input className={inputCls} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>

          {erro && <p className="mb-3 text-sm text-red-400">{erro}</p>}

          <button
            onClick={autenticar}
            disabled={carregando}
            className="w-full rounded-full bg-[#c8ff00] px-5 py-2.5 font-medium text-[#1e2d27] transition-colors hover:bg-[#dcff4d] disabled:opacity-60"
          >
            {carregando ? "Aguarde..." : modal === "registro" ? "Cadastrar" : "Entrar"}
          </button>
          <button
            onClick={() => {
              setModal(modal === "registro" ? "login" : "registro");
              setErro("");
            }}
            className="mt-3 w-full text-center text-sm text-white/50 hover:underline"
          >
            {modal === "registro" ? "Já tem conta? Entrar" : "Não tem conta? Cadastre-se"}
          </button>
        </div>
      </main>
    );
  }

  const chartData = (dados?.historico ?? []).map((h) => ({
    dia: h.dia.slice(5, 10),
    energia: h.energia,
    agua: h.agua,
  }));

  const dadosPorAmbiente = (dados?.consumoPorAmbiente ?? []).map((a) => ({
    nome: a.nome,
    Energia: a.energia,
    Agua: a.agua,
  }));

  const dadosPizza = [
    { name: "Energia", value: dados?.totais.energia ?? 0, color: "#c8ff00" },
    { name: "Água", value: dados?.totais.agua ?? 0, color: "#1385ef" },
  ].filter((d) => d.value > 0);

  const tooltipStyle = {
    backgroundColor: "#000",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
  } as const;

  return (
    <div className="min-h-full flex-1 bg-[#1e2d27]">
      <NavBar />
      <main className="mx-auto max-w-6xl p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Olá, {usuario?.nome ?? "visitante"}!</h1>
            <p className="text-sm text-white/50">Painel ECoM — controle de água e energia</p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
            {dados?.ambientes ?? 0} ambiente(s)
          </span>
        </header>

        {carregandoDados ? (
          <div className="flex items-center justify-center py-32 text-white/60">
            Carregando dados...
          </div>
        ) : !dados ? (
          <div className="flex items-center justify-center py-32 text-white/60">
            Sem dados disponíveis. Registre consumo no app mobile ou via API.
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Energia (total)" valor={`${dados.totais.energia} kWh`} cor="#c8ff00" />
              <MetricCard label="Água (total)" valor={`${dados.totais.agua} L`} cor="#1385ef" />
              <MetricCard label="Custo total" valor={formatarCusto(dados.totais.custoTotal)} cor="#69f0ae" />
              <MetricCard
                label="Alertas ativos"
                valor={String(dados.alertas.ativos)}
                cor={dados.alertas.criticos > 0 ? "#ff5252" : "#ffc107"}
              />
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card titulo="Energia no mês">
                <p className="text-3xl font-bold text-[#c8ff00]">{dados.mes.energia} kWh</p>
                <p className="mt-1 text-xs text-white/40">
                  Tarifa: {formatarCusto(dados.tarifas.energia)}/kWh
                </p>
              </Card>
              <Card titulo="Água no mês">
                <p className="text-3xl font-bold text-[#1385ef]">{dados.mes.agua} L</p>
                <p className="mt-1 text-xs text-white/40">
                  Tarifa: {formatarCusto(dados.tarifas.agua)}/m³
                </p>
              </Card>
              <Card titulo="Custos">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Energia</span>
                    <span className="text-white">{formatarCusto(dados.totais.custoEnergia)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Água</span>
                    <span className="text-white">{formatarCusto(dados.totais.custoAgua)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1">
                    <span className="font-medium text-white">Total</span>
                    <span className="font-bold text-[#69f0ae]">
                      {formatarCusto(dados.totais.custoTotal)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {chartData.length > 0 && (
              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <Card titulo="Consumo de Energia (kWh/dia)">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                      <XAxis dataKey="dia" stroke="#ffffff60" fontSize={11} />
                      <YAxis stroke="#ffffff60" fontSize={11} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: "#fff" }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Line type="monotone" dataKey="energia" stroke="#c8ff00" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
                <Card titulo="Consumo de Água (L/dia)">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                      <XAxis dataKey="dia" stroke="#ffffff60" fontSize={11} />
                      <YAxis stroke="#ffffff60" fontSize={11} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: "#fff" }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Line type="monotone" dataKey="agua" stroke="#1385ef" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            )}

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              {dadosPizza.length > 0 && (
                <Card titulo="Proporção do consumo">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={dadosPizza}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={4}
                      >
                        {dadosPizza.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {dadosPorAmbiente.length > 0 && (
                <Card titulo="Consumo por ambiente">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosPorAmbiente}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                      <XAxis dataKey="nome" stroke="#ffffff60" fontSize={11} />
                      <YAxis stroke="#ffffff60" fontSize={11} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
                      <Legend />
                      <Bar dataKey="Energia" fill="#c8ff00" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Agua" fill="#1385ef" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>

            <Card titulo="Alertas recentes">
              {dados.alertasRecentes.length === 0 ? (
                <p className="text-sm text-white/50">Nenhum alerta por enquanto.</p>
              ) : (
                <ul className="space-y-2">
                  {dados.alertasRecentes.map((a: Alerta) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: nivelCor(a.nivel) }}
                      />
                      <span className="text-white/90">{a.mensagem}</span>
                      <span className="ml-auto whitespace-nowrap text-xs text-white/40">
                        {new Date(a.data).toLocaleString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-black p-5 shadow-lg">
      <h2 className="mb-3 font-semibold text-white">{titulo}</h2>
      {children}
    </section>
  );
}

function MetricCard({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="rounded-2xl bg-black p-5 shadow-lg" style={{ borderLeft: `3px solid ${cor}` }}>
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{valor}</p>
    </div>
  );
}