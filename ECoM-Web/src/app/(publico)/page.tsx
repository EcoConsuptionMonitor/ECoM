"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const RECURSOS = [
  {
    icone: <PainelIcone />,
    cor: "text-verde",
    fundo: "bg-verde-claro",
    titulo: "Painel em tempo real",
    texto:
      "Veja o gasto acumulado, o consumo do mês e o que está ligado agora — água e energia na mesma tela.",
  },
  {
    icone: <GraficoIcone />,
    cor: "text-agua",
    fundo: "bg-agua-claro",
    titulo: "Análises com gráficos",
    texto:
      "Compare períodos de 7, 14 e 30 dias, veja a proporção água/energia e o consumo por ambiente.",
  },
  {
    icone: <SinoIcone />,
    cor: "text-alerta",
    fundo: "bg-alerta-claro",
    titulo: "Alertas inteligentes",
    texto:
      "O sistema avisa automaticamente quando o consumo sai do padrão — antes que a conta surpreenda.",
  },
  {
    icone: <CasaIcone />,
    cor: "text-floresta",
    fundo: "bg-verde-claro",
    titulo: "Ambientes organizados",
    texto:
      "Cadastre quarto, cozinha, banheiro e mais. Cada leitura é atribuída ao ambiente certo.",
  },
  {
    icone: <BalaoIcone />,
    cor: "text-verde",
    fundo: "bg-verde-claro",
    titulo: "Controles e simulação",
    texto:
      "Ligue dispositivos e acompanhe o consumo em tempo real. Ao desligar, a leitura é registrada sozinha.",
  },
  {
    icone: <ChipIcone />,
    cor: "text-agua",
    fundo: "bg-agua-claro",
    titulo: "Sensores reais (IoT)",
    texto:
      "Integração com ESP32, sensores de corrente (ACS712) e de fluxo (YF-S201) numa maquete física.",
  },
];

const PASSOS = [
  {
    numero: "1",
    titulo: "O sensor mede",
    texto: "Sensores de corrente e fluxo capturam o consumo real da maquete a cada 30 segundos.",
  },
  {
    numero: "2",
    titulo: "A API calcula",
    texto: "O backend converte litros em m³, aplica as tarifas e gera alertas automaticamente.",
  },
  {
    numero: "3",
    titulo: "Você decide",
    texto: "Web e mobile mostram o gasto em reais e ajudam a reduzir o desperdício de água e energia.",
  },
];

const TARIFAS = [
  { rotulo: "Água", valor: "R$ 5,82", unidade: "por m³", cor: "text-agua", fundo: "bg-agua-claro" },
  { rotulo: "Energia", valor: "R$ 0,65", unidade: "por kWh", cor: "text-verde", fundo: "bg-verde-claro" },
];

export default function LandingPage() {
  const { carregando } = useAuth();

  return (
    <div className="min-h-screen bg-fundo">
      {/* Topo */}
      <header className="sticky top-0 z-10 border-b border-linha bg-superficie/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-floresta">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-verde text-white">
              <LeafMark />
            </span>
            ECoM
          </span>
          <nav className="flex items-center gap-2">
            <a
              href="#como-funciona"
              className="hidden rounded-full px-4 py-1.5 text-sm font-semibold text-texto-suave transition-colors hover:text-texto sm:block"
            >
              Como funciona
            </a>
            <a
              href="#recursos"
              className="hidden rounded-full px-4 py-1.5 text-sm font-semibold text-texto-suave transition-colors hover:text-texto sm:block"
            >
              Recursos
            </a>
            <Link
              href="/login"
              className="rounded-full px-4 py-1.5 text-sm font-bold text-floresta transition-colors hover:bg-verde-claro"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-full bg-verde px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-[#357a55]"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-verde-claro px-3.5 py-1.5 text-xs font-bold text-verde">
            <LeafMark />
            Monitoramento de água e energia
          </span>
          <h1 className="mt-5 text-[34px] font-extrabold leading-[1.1] tracking-tight text-floresta sm:text-[46px]">
            Saiba exatamente quanto sua casa gasta — e onde economizar.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-texto-suave sm:text-base">
            O <strong className="text-texto">ECoM</strong> conecta sensores reais a um painel simples. Acompanhe o
            consumo de água e energia em tempo real, entenda seus hábitos e aja antes que a conta chegue.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className={`flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-verde px-7 text-[15px] font-extrabold text-white transition-colors hover:bg-[#357a55] ${
                carregando ? "pointer-events-none opacity-60" : ""
              }`}
            >
              Começar agora
              <ArrowIcone />
            </Link>
            <Link
              href="/login"
              className="flex min-h-[52px] items-center justify-center rounded-2xl border border-linha bg-superficie px-7 text-[15px] font-extrabold text-texto transition-colors hover:border-verde"
            >
              Já tenho conta
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-8">
            {TARIFAS.map((t) => (
              <div key={t.rotulo} className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.fundo} ${t.cor}`}>
                  {t.rotulo === "Água" ? <AguaIcone /> : <EnergiaIcone />}
                </span>
                <span>
                  <span className="block text-[15px] font-extrabold text-texto">{t.valor}</span>
                  <span className="block text-[11px] text-texto-suave">
                    {t.rotulo} · {t.unidade}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mock do painel */}
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-verde-claro/70 blur-2xl" />
          <div className="rounded-[1.75rem] border border-linha bg-superficie p-5 shadow-sm">
            <div className="rounded-2xl bg-floresta p-5">
              <p className="text-[11px] font-extrabold tracking-[0.12em] text-[#b9ccc0]">GASTO ACUMULADO</p>
              <p className="mt-1.5 text-[30px] font-extrabold tracking-tight text-white">R$ 184,32</p>
              <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold text-[#d3f0b4]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#d3f0b4]" />
                Dados chegando dos sensores
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-linha bg-fundo p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-verde-claro text-verde">
                  <EnergiaIcone />
                </span>
                <p className="mt-3 text-[17px] font-extrabold text-texto">42,8 kWh</p>
                <p className="text-[11px] text-texto-suave">Energia no mês</p>
              </div>
              <div className="rounded-2xl border border-linha bg-fundo p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-agua-claro text-agua">
                  <AguaIcone />
                </span>
                <p className="mt-3 text-[17px] font-extrabold text-texto">3.240 L</p>
                <p className="text-[11px] text-texto-suave">Água no mês</p>
              </div>
            </div>

            {/* Mini gráfico de barras decorativo */}
            <div className="mt-4 rounded-2xl border border-linha bg-fundo p-4">
              <p className="mb-3 text-xs font-bold text-texto-suave">Consumo por dia</p>
              <div className="flex h-24 items-end gap-1.5">
                {[38, 52, 30, 64, 46, 72, 55, 41, 68, 58, 80, 49].map((altura, i) => (
                  <span
                    key={i}
                    className={`flex-1 rounded-t ${i % 2 === 0 ? "bg-verde/70" : "bg-agua/60"}`}
                    style={{ height: `${altura}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="border-y border-linha bg-superficie">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[28px] font-extrabold tracking-tight text-floresta sm:text-[34px]">
              Do sensor ao seu bolso, em 3 passos
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-texto-suave">
              Uma maquete física com sensores reais conversa com o backend e leva os dados até você.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PASSOS.map((p) => (
              <div key={p.numero} className="rounded-3xl border border-linha bg-fundo p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verde text-lg font-extrabold text-white">
                  {p.numero}
                </span>
                <h3 className="mt-4 text-[17px] font-bold text-texto">{p.titulo}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-texto-suave">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[28px] font-extrabold tracking-tight text-floresta sm:text-[34px]">
            Tudo o que o ECoM faz por você
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-texto-suave">
            Web e mobile compartilham a mesma base — seus dados sempre atualizados onde você estiver.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r) => (
            <article key={r.titulo} className="rounded-3xl border border-linha bg-superficie p-6">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${r.fundo} ${r.cor}`}>
                {r.icone}
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-texto">{r.titulo}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-texto-suave">{r.texto}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Chamada final */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-floresta px-6 py-14 text-center sm:px-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#285044] text-[#d3f0b4]">
            <LeafMarkGrande />
          </span>
          <h2 className="mx-auto mt-6 max-w-2xl text-[28px] font-extrabold tracking-tight text-white sm:text-[34px]">
            Comece a economizar água e energia hoje
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#c7d6cf]">
            Crie sua conta gratuitamente e acompanhe o consumo da sua casa em tempo real.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white px-7 text-[15px] font-extrabold text-floresta transition-transform hover:scale-[1.02]"
            >
              Criar minha conta
              <ArrowIcone />
            </Link>
            <Link
              href="/login"
              className="flex min-h-[52px] items-center justify-center rounded-2xl border border-[#376154] px-7 text-[15px] font-extrabold text-white transition-colors hover:bg-[#285044]"
            >
              Entrar
            </Link>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-linha bg-superficie">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <span className="flex items-center gap-2 text-sm font-extrabold text-floresta">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-verde text-white">
              <LeafMark />
            </span>
            ECoM — EcoMonitor
          </span>
          <p className="text-center text-[12px] text-texto-suave">
            Projeto educacional de monitoramento de consumo · Água e energia em um só lugar
          </p>
        </div>
      </footer>
    </div>
  );
}

function LeafMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function LeafMarkGrande() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function PainelIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function GraficoIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m7 15 4-5 3 3 5-7" />
    </svg>
  );
}

function SinoIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function CasaIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function BalaoIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function ChipIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    </svg>
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

function ArrowIcone() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
