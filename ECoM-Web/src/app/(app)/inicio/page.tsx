"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Carregando } from "@/components/Carregando";
import { Vazio } from "@/components/Vazio";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Alerta, Dashboard, NivelAlerta } from "@/lib/types";

const formatar = (valor: number, casas = 0) =>
  Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

const CORES_NIVEL: Record<NivelAlerta, string> = {
  critico: "bg-perigo",
  alerta: "bg-alerta",
  info: "bg-verde",
};

export default function InicioPage() {
  const { usuario } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.getDashboard();
      setDashboard(dados);
      setErro(false);
    } catch {
      setErro(true);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      await carregar();
      if (ativo) setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, [carregar]);

  const totais = dashboard?.totais ?? { energia: 0, agua: 0, custoTotal: 0 };
  const ativos = dashboard?.alertas.ativos ?? 0;
  const alertas = dashboard?.alertasRecentes ?? [];
  const primeiroNome = usuario?.nome?.split(" ")[0] ?? "você";

  if (carregando) return <Carregando texto="Carregando seu painel..." />;

  return (
    <div>
      <header className="mb-7 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-texto">Olá, {primeiroNome}</h1>
          <p className="mt-1 text-sm text-texto-suave">Sua casa, em um só lugar.</p>
        </div>
        <Link
          href="/perfil"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-verde text-base font-extrabold text-floresta"
          aria-label="Abrir perfil"
        >
          {primeiroNome.slice(0, 1).toUpperCase()}
        </Link>
      </header>

      {erro || !dashboard ? (
        <Vazio
          titulo="Erro ao carregar dados"
          descricao="Verifique a conexão com a API e tente novamente."
        />
      ) : (
        <>
          {/* Hero: gasto acumulado */}
          <section className="mb-7 rounded-3xl bg-floresta p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-extrabold tracking-[0.12em] text-[#b9ccc0]">GASTO ACUMULADO</p>
                <p className="mt-2 text-[31px] font-extrabold tracking-tight text-white">
                  R$ {formatar(totais.custoTotal, 2)}
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#285044] text-[#d3f0b4]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </span>
            </div>
            <div className="my-4 h-px bg-[#376154]" />
            <p className="max-w-lg text-[13px] leading-relaxed text-[#d0ddd5]">
              Acompanhe seus recursos e faça escolhas mais leves para o planeta.
            </p>
          </section>

          {/* Consumo total */}
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold text-texto">Consumo total</h2>
            <Link href="/dashboard" className="text-[13px] font-bold text-verde hover:underline">
              Ver análises
            </Link>
          </div>
          <div className="mb-7 grid gap-4 sm:grid-cols-2">
            <Metrica
              cor="text-verde"
              fundo="bg-verde-claro"
              valor={`${formatar(totais.energia, 2)} kWh`}
              titulo="Energia"
              icone={<EnergiaIcone />}
            />
            <Metrica
              cor="text-agua"
              fundo="bg-agua-claro"
              valor={`${formatar(totais.agua)} L`}
              titulo="Água"
              icone={<AguaIcone />}
            />
          </div>

          {/* Resumo de alertas */}
          <Link
            href="/alertas"
            className="mb-7 flex items-center gap-4 rounded-3xl border border-linha bg-superficie p-4 transition-colors hover:border-verde"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                ativos ? "bg-alerta-claro text-alerta" : "bg-verde-claro text-verde"
              }`}
            >
              {ativos ? <SinoIcone /> : <CheckIcone />}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-texto">
                {ativos
                  ? `${ativos} alerta${ativos > 1 ? "s" : ""} para revisar`
                  : "Tudo sob controle"}
              </span>
              <span className="mt-0.5 block text-xs text-texto-suave">
                {ativos ? "Clique para ver os detalhes" : "Nenhuma pendência recente."}
              </span>
            </span>
            <ChevronIcone />
          </Link>

          {/* Alertas recentes */}
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold text-texto">Aconteceu por aí</h2>
            <span className="text-xs text-texto-suave">Recente</span>
          </div>
          <div className="mb-7 overflow-hidden rounded-3xl border border-linha bg-superficie">
            {alertas.length ? (
              alertas.slice(0, 3).map((alerta) => <ItemAlerta key={alerta.id} alerta={alerta} />)
            ) : (
              <p className="p-5 text-center text-[13px] text-texto-suave">
                Ainda não há leituras ou alertas recentes.
              </p>
            )}
          </div>

          <Link
            href="/controles"
            className="flex items-center justify-center gap-3 rounded-3xl bg-verde px-5 py-4 text-sm font-extrabold text-white transition-colors hover:bg-[#357a55]"
          >
            <PlusIcone />
            Registrar consumo
            <ArrowIcone />
          </Link>
        </>
      )}
    </div>
  );
}

function Metrica({
  cor,
  fundo,
  valor,
  titulo,
  icone,
}: {
  cor: string;
  fundo: string;
  valor: string;
  titulo: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-linha bg-superficie p-5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${fundo} ${cor}`}>{icone}</span>
      <p className="mt-4 text-[17px] font-extrabold text-texto">{valor}</p>
      <p className="mt-1 text-xs text-texto-suave">{titulo}</p>
    </div>
  );
}

function ItemAlerta({ alerta }: { alerta: Alerta }) {
  const cor = CORES_NIVEL[alerta.nivel] ?? "bg-verde";
  const origem = alerta.tipo === "agua" ? "Água" : alerta.tipo === "energia" ? "Energia" : "Sistema";
  return (
    <div className="flex min-h-[62px] items-center border-b border-linha pr-4 last:border-b-0">
      <span className={`mx-4 h-8 w-1 shrink-0 rounded-full ${cor}`} />
      <div className="min-w-0 flex-1 py-3">
        <p className="truncate text-[13px] font-semibold text-texto">{alerta.mensagem}</p>
        <p className="mt-1 text-[11px] text-texto-suave">
          {origem} · {new Date(alerta.data).toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>
  );
}

function EnergiaIcone() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function AguaIcone() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function SinoIcone() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function CheckIcone() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronIcone() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-texto-suave">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PlusIcone() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ArrowIcone() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
