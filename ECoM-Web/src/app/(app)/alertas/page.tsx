"use client";

import { useCallback, useEffect, useState } from "react";
import { Carregando } from "@/components/Carregando";
import { Vazio } from "@/components/Vazio";
import { api } from "@/lib/api";
import type { Alerta, NivelAlerta } from "@/lib/types";

const NIVEIS: Record<NivelAlerta, { cor: string; fundo: string; rotulo: string }> = {
  critico: { cor: "text-perigo", fundo: "bg-perigo-claro", rotulo: "Crítico" },
  alerta: { cor: "text-alerta", fundo: "bg-alerta-claro", rotulo: "Alerta" },
  info: { cor: "text-verde", fundo: "bg-verde-claro", rotulo: "Info" },
};

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.getAlertas();
      setAlertas(dados);
    } catch {
      setAlertas([]);
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

  async function marcarLido(alerta: Alerta) {
    if (alerta.lido) return;
    setEnviando(alerta.id);
    try {
      const atualizado = await api.marcarAlertaLido(alerta.id);
      setAlertas((prev) => prev.map((a) => (a.id === atualizado.id ? atualizado : a)));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Não foi possível marcar como lido.");
    } finally {
      setEnviando(null);
    }
  }

  const naoLidos = alertas.filter((a) => !a.lido).length;

  if (carregando) return <Carregando texto="Carregando alertas..." />;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight text-texto">Alertas</h1>
        <p className="mt-1 text-sm text-texto-suave">
          {naoLidos > 0
            ? `${naoLidos} não lido${naoLidos > 1 ? "s" : ""}`
            : "Tudo em dia"}
        </p>
      </header>

      {alertas.length === 0 ? (
        <Vazio
          titulo="Nenhum alerta"
          descricao="Quando o consumo sair do padrão, avisaremos você aqui."
        />
      ) : (
        <ul className="space-y-3">
          {alertas.map((item) => {
            const nivel = NIVEIS[item.nivel] ?? NIVEIS.info;
            const origem = item.tipo === "agua" ? "Água" : item.tipo === "energia" ? "Energia" : "Sistema";
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-linha border-l-4 bg-superficie p-4"
                style={{
                  borderLeftColor:
                    item.nivel === "critico" ? "#c44e4e" : item.nivel === "alerta" ? "#c16c32" : "#3e8d62",
                }}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${nivel.fundo} ${nivel.cor}`}
                >
                  <SinoIcone />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold leading-[19px] text-texto">{item.mensagem}</p>
                  <p className="mt-1 text-[11.5px] text-texto-suave">
                    {nivel.rotulo} · {origem} · {new Date(item.data).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {!item.lido ? (
                  <button
                    onClick={() => marcarLido(item)}
                    disabled={enviando === item.id}
                    className="shrink-0 rounded-full bg-verde-claro px-3 py-1.5 text-xs font-bold text-verde transition-colors hover:bg-[#d7ecdd] disabled:opacity-60"
                  >
                    {enviando === item.id ? "..." : "Lido"}
                  </button>
                ) : (
                  <span className="shrink-0 text-verde" aria-label="Lido">
                    <CheckIcone />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
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

function CheckIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
