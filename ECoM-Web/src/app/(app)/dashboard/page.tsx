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
import { Carregando } from "@/components/Carregando";
import { Vazio } from "@/components/Vazio";
import { api } from "@/lib/api";
import type { Dashboard, NivelAlerta } from "@/lib/types";

const PERIODOS = [
  { chave: "7", rotulo: "7 dias", dias: 7 },
  { chave: "14", rotulo: "14 dias", dias: 14 },
  { chave: "30", rotulo: "30 dias", dias: 30 },
] as const;

type ChavePeriodo = (typeof PERIODOS)[number]["chave"];

const CORES_NIVEL: Record<NivelAlerta, string> = {
  critico: "bg-perigo",
  alerta: "bg-alerta",
  info: "bg-verde",
};

const formatar = (valor: number, casas = 2) =>
  Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

const moeda = (valor: number) =>
  Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e1e6e1",
  borderRadius: 12,
  color: "#16352b",
  fontSize: 12,
} as const;

export default function AnalisesPage() {
  const [dados, setDados] = useState<Dashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [periodo, setPeriodo] = useState<ChavePeriodo>("7");

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const resposta = await api.getDashboard();
        if (ativo) setDados(resposta);
      } catch {
        if (ativo) setErro(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  if (carregando) return <Carregando texto="Carregando análises..." />;
  if (erro || !dados) {
    return (
      <Vazio titulo="Erro ao carregar dados" descricao="Verifique a conexão com a API e tente novamente." />
    );
  }

  const dias = PERIODOS.find((p) => p.chave === periodo)?.dias ?? 7;
  const historico = dados.historico.slice(-dias);
  const chartData = historico.map((h) => ({
    dia: h.dia.slice(8, 10) + "/" + h.dia.slice(5, 7),
    energia: h.energia,
    agua: h.agua,
  }));

  const dadosPizza = [
    { name: "Energia", value: dados.totais.energia, color: "#3e8d62" },
    { name: "Água", value: dados.totais.agua, color: "#3478c5" },
  ].filter((d) => d.value > 0);

  const porAmbiente = dados.consumoPorAmbiente.map((a) => ({
    nome: a.nome.length > 8 ? a.nome.slice(0, 8) + "…" : a.nome,
    Energia: a.energia,
    Agua: a.agua,
  }));

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-[26px] font-extrabold tracking-tight text-texto">Análises</h1>
        <p className="mt-1 text-sm text-texto-suave">Visão geral do consumo</p>
      </header>

      <div className="mb-6 flex gap-2">
        {PERIODOS.map((p) => {
          const ativo = periodo === p.chave;
          return (
            <button
              key={p.chave}
              onClick={() => setPeriodo(p.chave)}
              className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                ativo
                  ? "border-verde bg-verde text-white"
                  : "border-linha bg-superficie text-texto-suave hover:text-texto"
              }`}
            >
              {p.rotulo}
            </button>
          );
        })}
      </div>

      {/* Resumos do mês */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <ResumoCard cor="border-verde" icone={<EnergiaIcone />} corIcone="text-verde" valor={`${formatar(dados.mes.energia)} kWh`} rotulo="Energia (mês)" />
        <ResumoCard cor="border-agua" icone={<AguaIcone />} corIcone="text-agua" valor={`${formatar(dados.mes.agua)} L`} rotulo="Água (mês)" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <ResumoCard cor="border-verde" icone={<CustoIcone />} corIcone="text-verde" valor={moeda(dados.totais.custoEnergia)} rotulo="Custo energia" />
        <ResumoCard cor="border-agua" icone={<CustoIcone />} corIcone="text-agua" valor={moeda(dados.totais.custoAgua)} rotulo="Custo água" />
      </div>

      {/* Custo total */}
      <section className="mb-7 rounded-3xl bg-floresta p-6 text-center">
        <p className="text-[13px] text-[#b9ccc0]">Custo total acumulado</p>
        <p className="mt-1 text-[32px] font-extrabold text-white">{moeda(dados.totais.custoTotal)}</p>
        <p className="mt-2 text-xs text-[#8fa89c]">
          Tarifa energia: {moeda(dados.tarifas.energia)}/kWh · Tarifa água: {moeda(dados.tarifas.agua)}/m³
        </p>
      </section>

      {/* Gráficos de linha */}
      {chartData.length > 1 && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <Grafico titulo={`Energia — últimos ${dias} dias`}>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e6e1" />
                <XAxis dataKey="dia" stroke="#6a7c74" fontSize={11} />
                <YAxis stroke="#6a7c74" fontSize={11} domain={[0, "auto"]} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#16352b" }} itemStyle={{ color: "#16352b" }} />
                <Line type="monotone" dataKey="energia" stroke="#3e8d62" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Grafico>
          <Grafico titulo={`Água — últimos ${dias} dias`}>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e6e1" />
                <XAxis dataKey="dia" stroke="#6a7c74" fontSize={11} />
                <YAxis stroke="#6a7c74" fontSize={11} domain={[0, "auto"]} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#16352b" }} itemStyle={{ color: "#16352b" }} />
                <Line type="monotone" dataKey="agua" stroke="#3478c5" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Grafico>
        </div>
      )}

      {/* Pizza + barras */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {dadosPizza.length > 0 && (
          <Grafico titulo="Proporção do consumo (total)">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {dadosPizza.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#16352b" }} itemStyle={{ color: "#16352b" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Grafico>
        )}

        {porAmbiente.length > 0 && (
          <Grafico titulo="Consumo por ambiente">
            <div className="mb-3 flex gap-5">
              <Legenda cor="#3e8d62" texto="Energia (kWh)" />
              <Legenda cor="#3478c5" texto="Água (L)" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={porAmbiente}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e6e1" />
                <XAxis dataKey="nome" stroke="#6a7c74" fontSize={11} />
                <YAxis stroke="#6a7c74" fontSize={11} domain={[0, "auto"]} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#16352b" }} itemStyle={{ color: "#16352b" }} />
                <Bar dataKey="Energia" fill="#3e8d62" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Agua" fill="#3478c5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Grafico>
        )}
      </div>

      {/* Alertas */}
      <Grafico titulo="Alertas">
        <div className="mb-3">
          <span className="inline-block rounded-full bg-perigo-claro px-3 py-1 text-xs font-semibold text-perigo">
            {dados.alertas.ativos} ativo(s)
          </span>
        </div>
        {dados.alertasRecentes.length === 0 ? (
          <p className="text-sm text-verde">Nenhum alerta recente.</p>
        ) : (
          <ul className="space-y-2.5">
            {dados.alertasRecentes.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${CORES_NIVEL[a.nivel] ?? "bg-verde"}`} />
                <span className="min-w-0 flex-1 truncate text-texto">{a.mensagem}</span>
                <span className="shrink-0 text-xs text-texto-suave">
                  {new Date(a.data).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Grafico>
    </div>
  );
}

function Grafico({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-linha bg-superficie p-5">
      <h2 className="mb-4 text-[15px] font-bold text-texto">{titulo}</h2>
      {children}
    </section>
  );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span className="flex items-center gap-2 text-xs text-texto-suave">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cor }} />
      {texto}
    </span>
  );
}

function ResumoCard({
  cor,
  icone,
  corIcone,
  valor,
  rotulo,
}: {
  cor: string;
  icone: React.ReactNode;
  corIcone: string;
  valor: string;
  rotulo: string;
}) {
  return (
    <div className={`rounded-3xl border border-linha border-l-[3px] bg-superficie p-4 ${cor}`}>
      <span className={`inline-flex ${corIcone}`}>{icone}</span>
      <p className="mt-2.5 text-[17px] font-extrabold text-texto">{valor}</p>
      <p className="mt-1 text-xs text-texto-suave">{rotulo}</p>
    </div>
  );
}

function EnergiaIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function AguaIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function CustoIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}
