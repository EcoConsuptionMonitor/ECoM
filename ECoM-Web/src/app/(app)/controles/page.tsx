"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Carregando } from "@/components/Carregando";
import { api } from "@/lib/api";
import type { Ambiente, TipoConsumo } from "@/lib/types";

interface Dispositivo {
  id: string;
  nome: string;
  icone: React.ReactNode;
  tipo: TipoConsumo;
  potencia?: number;
  vazao?: number;
  ligado: boolean;
  /** Timestamp (ms) em que o dispositivo foi ligado; null quando desligado. */
  iniciadoEm: number | null;
}

/** Formata uma duração em ms como HH:MM:SS. */
function formatarDuracao(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

const DISPOSITIVOS_PADRAO: Dispositivo[] = [
  { id: "lampada_sala", nome: "Lâmpada Sala", icone: <LampadaIcone />, tipo: "energia", potencia: 15, ligado: false, iniciadoEm: null },
  { id: "lampada_quarto", nome: "Lâmpada Quarto", icone: <LampadaIcone />, tipo: "energia", potencia: 15, ligado: false, iniciadoEm: null },
  { id: "lampada_cozinha", nome: "Lâmpada Cozinha", icone: <LampadaIcone />, tipo: "energia", potencia: 20, ligado: false, iniciadoEm: null },
  { id: "tomada_tv", nome: "TV", icone: <TvIcone />, tipo: "energia", potencia: 100, ligado: false, iniciadoEm: null },
  { id: "tomada_geladeira", nome: "Geladeira", icone: <GeladeiraIcone />, tipo: "energia", potencia: 150, ligado: false, iniciadoEm: null },
  { id: "chuveiro", nome: "Chuveiro", icone: <ChuveiroIcone />, tipo: "energia", potencia: 5500, ligado: false, iniciadoEm: null },
  { id: "torneira_cozinha", nome: "Torneira Cozinha", icone: <AguaIcone />, tipo: "agua", vazao: 8, ligado: false, iniciadoEm: null },
  { id: "torneira_banheiro", nome: "Torneira Banheiro", icone: <AguaIcone />, tipo: "agua", vazao: 6, ligado: false, iniciadoEm: null },
  { id: "maquina_lavar", nome: "Máquina de Lavar", icone: <MaquinaIcone />, tipo: "agua", vazao: 50, ligado: false, iniciadoEm: null },
];

export default function ControlesPage() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>(DISPOSITIVOS_PADRAO);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [ambienteId, setAmbienteId] = useState<string | null>(null);
  const [tarifas, setTarifas] = useState({ agua: 5.82, energia: 0.65 });
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  // Relógio de 1s para atualizar o tempo decorrido dos dispositivos ligados.
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [listaAmbientes, dashboard] = await Promise.all([api.getAmbientes(), api.getDashboard()]);
        if (!ativo) return;
        setAmbientes(listaAmbientes);
        setTarifas(dashboard.tarifas);
        setAmbienteId(listaAmbientes[0]?.id ?? null);
      } catch {
        if (ativo) setAmbientes([]);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const consumoTempoReal = dispositivos.reduce(
    (acc, d) => {
      if (!d.ligado) return acc;
      if (d.tipo === "energia") acc.energia += d.potencia ?? 0;
      else acc.agua += d.vazao ?? 0;
      return acc;
    },
    { energia: 0, agua: 0 }
  );

  const custoHoraEnergia = (consumoTempoReal.energia / 1000) * tarifas.energia;
  const custoHoraAgua = ((consumoTempoReal.agua * 60) / 1000) * tarifas.agua;
  const dispositivosLigados = dispositivos.filter((d) => d.ligado);

  /** Envia ao backend o consumo acumulado durante o tempo que o dispositivo ficou ligado. */
  async function registrarConsumo(dispositivo: Dispositivo, duracaoMs: number) {
    const minutos = duracaoMs / 60000;
    if (minutos < 1 / 60) return; // ignora liga/desliga instantâneo (< 1s)

    const valor =
      dispositivo.tipo === "energia"
        ? ((dispositivo.potencia ?? 0) / 1000) * (minutos / 60) // kWh consumidos
        : (dispositivo.vazao ?? 0) * minutos; // litros consumidos

    await api.enviarSensor({
      ambienteId: ambienteId as string,
      tipo: dispositivo.tipo,
      valor,
      unidade: dispositivo.tipo === "energia" ? "kWh" : "L",
      potencia: dispositivo.tipo === "energia" ? dispositivo.potencia : undefined,
      corrente:
        dispositivo.tipo === "energia"
          ? Number(((dispositivo.potencia ?? 0) / 127).toFixed(2))
          : undefined,
      tensao: dispositivo.tipo === "energia" ? 127 : undefined,
    });

    const decorrido = formatarDuracao(duracaoMs);
    const detalhe =
      dispositivo.tipo === "energia"
        ? `${valor.toFixed(4)} kWh`
        : `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} L`;
    return `"${dispositivo.nome}" ficou ligado por ${decorrido} e consumiu ${detalhe}.`;
  }

  function ligar(dispositivo: Dispositivo) {
    setAviso(null);
    setDispositivos((prev) =>
      prev.map((d) => (d.id === dispositivo.id ? { ...d, ligado: true, iniciadoEm: Date.now() } : d))
    );
    setAgora(Date.now());
  }

  async function desligar(dispositivo: Dispositivo) {
    const iniciadoEm = dispositivo.iniciadoEm ?? Date.now();
    const duracaoMs = Date.now() - iniciadoEm;

    // Desliga imediatamente na interface; o registro acontece em seguida.
    setDispositivos((prev) =>
      prev.map((d) => (d.id === dispositivo.id ? { ...d, ligado: false, iniciadoEm: null } : d))
    );

    if (!ambienteId) {
      setAviso("Cadastre ao menos um ambiente antes de registrar leituras.");
      return;
    }

    setEnviando(dispositivo.id);
    setAviso(null);
    try {
      const mensagem = await registrarConsumo(dispositivo, duracaoMs);
      if (mensagem) setAviso(mensagem);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Verifique a conexão com a API.");
    } finally {
      setEnviando(null);
    }
  }

  if (carregando) return <Carregando texto="Carregando controles..." />;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight text-texto">Controles</h1>
        <p className="mt-1 text-[13px] text-texto-suave">
          Ligue um dispositivo: o consumo é medido em tempo real e registrado quando você desligar.
        </p>
      </header>

      {/* Status em tempo real */}
      <div className="mb-3 flex rounded-2xl border border-linha bg-superficie p-4">
        <div className="flex flex-1 flex-col items-center">
          <span className="text-verde">
            <FlashIcone />
          </span>
          <p className="mt-1 text-[18px] font-extrabold text-texto">{consumoTempoReal.energia} W</p>
          <p className="mt-0.5 text-[11px] text-texto-suave">Energia ativa</p>
        </div>
        <div className="my-1 w-px bg-linha" />
        <div className="flex flex-1 flex-col items-center">
          <span className="text-agua">
            <AguaIconeGrande />
          </span>
          <p className="mt-1 text-[18px] font-extrabold text-texto">{consumoTempoReal.agua} L/min</p>
          <p className="mt-0.5 text-[11px] text-texto-suave">Água ativa</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-verde-claro p-3 text-center">
        <p className="text-[13px] font-bold text-verde">
          Custo/hora estimado: R$ {(custoHoraEnergia + custoHoraAgua).toFixed(4)}
        </p>
      </div>

      {/* Ambiente de destino */}
      <h2 className="mb-3 text-base font-extrabold text-texto">Ambiente de destino</h2>
      {ambientes.length === 0 ? (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-alerta-claro p-3">
          <span className="text-alerta">
            <GridIcone />
          </span>
          <p className="flex-1 text-xs leading-[18px] text-alerta">
            Nenhum ambiente cadastrado —{" "}
            <Link href="/ambientes" className="font-bold underline">
              crie um em Ambientes
            </Link>{" "}
            para registrar leituras.
          </p>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2">
          {ambientes.map((amb) => {
            const ativo = amb.id === ambienteId;
            return (
              <button
                key={amb.id}
                onClick={() => setAmbienteId(amb.id)}
                className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                  ativo
                    ? "border-floresta bg-floresta text-white"
                    : "border-linha bg-superficie text-texto-suave hover:text-texto"
                }`}
              >
                {amb.nome}
              </button>
            );
          })}
        </div>
      )}

      {aviso && (
        <p className="mb-4 rounded-xl bg-verde-claro p-3 text-center text-[13px] font-semibold text-verde">
          {aviso}
        </p>
      )}

      <Secao
        titulo="Energia Elétrica"
        tipo="energia"
        dispositivos={dispositivos}
        agora={agora}
        enviando={enviando}
        ligar={ligar}
        desligar={desligar}
      />
      <Secao
        titulo="Água"
        tipo="agua"
        dispositivos={dispositivos}
        agora={agora}
        enviando={enviando}
        ligar={ligar}
        desligar={desligar}
      />

      {dispositivosLigados.length > 0 && (
        <section className="mb-6 rounded-2xl border border-linha bg-superficie p-4">
          <h2 className="mb-3 text-sm font-extrabold text-texto">Dispositivos ligados</h2>
          {dispositivosLigados.map((d) => {
            const decorrido = agora - (d.iniciadoEm ?? agora);
            const minutos = decorrido / 60000;
            const consumido =
              d.tipo === "energia"
                ? `${(((d.potencia ?? 0) / 1000) * (minutos / 60)).toFixed(4)} kWh`
                : `${((d.vazao ?? 0) * minutos).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} L`;
            return (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 border-b border-linha py-2 last:border-b-0 last:pb-0"
              >
                <span className="min-w-0 flex-1 truncate text-[13px] text-texto-suave">{d.nome}</span>
                <span className="shrink-0 font-mono text-[13px] font-bold text-floresta">
                  {formatarDuracao(decorrido)}
                </span>
                <span className="w-24 shrink-0 text-right text-[13px] font-bold text-verde">
                  {consumido}
                </span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

function Secao({
  titulo,
  tipo,
  dispositivos,
  agora,
  enviando,
  ligar,
  desligar,
}: {
  titulo: string;
  tipo: TipoConsumo;
  dispositivos: Dispositivo[];
  agora: number;
  enviando: string | null;
  ligar: (d: Dispositivo) => void;
  desligar: (d: Dispositivo) => void;
}) {
  const cor = tipo === "energia" ? "text-verde" : "text-agua";
  const fundo = tipo === "energia" ? "bg-verde-claro" : "bg-agua-claro";
  const lista = dispositivos.filter((d) => d.tipo === tipo);

  return (
    <section className="mb-7">
      <h2 className="mb-3 text-base font-extrabold text-texto">{titulo}</h2>
      {lista.map((disp) => {
        const decorrido = disp.ligado ? agora - (disp.iniciadoEm ?? agora) : 0;
        const minutos = decorrido / 60000;
        const consumido =
          disp.tipo === "energia"
            ? `${(((disp.potencia ?? 0) / 1000) * (minutos / 60)).toFixed(3)} kWh`
            : `${((disp.vazao ?? 0) * minutos).toFixed(1)} L`;

        return (
          <article
            key={disp.id}
            className={`mb-3 rounded-2xl border p-3.5 transition-colors ${
              disp.ligado ? "border-verde bg-verde-claro/40" : "border-linha bg-superficie"
            }`}
          >
            <div className="flex items-center">
              <span
                className={`mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${fundo} ${
                  disp.ligado ? cor : "text-texto-suave"
                }`}
              >
                {disp.icone}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-texto">{disp.nome}</p>
                <p className="mt-0.5 text-xs text-texto-suave">
                  {disp.tipo === "energia" ? `${disp.potencia}W` : `${disp.vazao} L/min`}
                </p>
              </div>
              <button
                onClick={() => (disp.ligado ? desligar(disp) : ligar(disp))}
                disabled={enviando === disp.id}
                aria-pressed={disp.ligado}
                aria-label={`${disp.ligado ? "Desligar" : "Ligar"} ${disp.nome}`}
                className={`relative h-7 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                  disp.ligado ? "bg-verde" : "bg-linha"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    disp.ligado ? "left-8" : "left-1"
                  }`}
                />
              </button>
            </div>

            {disp.ligado && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-superficie px-3 py-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-texto-suave">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-verde" />
                  Ligado há
                </span>
                <span className="font-mono text-[15px] font-bold text-floresta">
                  {formatarDuracao(decorrido)}
                </span>
                <span className="text-[13px] font-bold text-verde">{consumido}</span>
              </div>
            )}

            {enviando === disp.id && (
              <p className="mt-2 text-center text-xs text-texto-suave">Registrando consumo...</p>
            )}
          </article>
        );
      })}
    </section>
  );
}

function LampadaIcone() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}

function TvIcone() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="m17 2-5 5-5-5" />
    </svg>
  );
}

function GeladeiraIcone() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM4 10h16M9 6v2M9 14v3" />
    </svg>
  );
}

function ChuveiroIcone() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4 2 6M14 4l-4 4M9 22a5 5 0 0 0 5-5V9H7v3M7 16v1M11 16v2M15 16v1M18 16v2" />
    </svg>
  );
}

function AguaIcone() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function MaquinaIcone() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="18" height="20" rx="2" />
      <circle cx="12" cy="14" r="5" />
      <path d="M7 6h.01M11 6h.01" />
    </svg>
  );
}

function FlashIcone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function AguaIconeGrande() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function GridIcone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
