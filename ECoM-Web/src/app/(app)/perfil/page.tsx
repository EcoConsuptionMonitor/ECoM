"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { Carregando } from "@/components/Carregando";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Tarifa, Usuario } from "@/lib/types";

const iniciais = (nome = "") =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase() || "EC";

function valorTarifa(lista: Tarifa[], tipo: "agua" | "energia") {
  return lista.find((t) => t.tipo === tipo)?.valorPorUnidade;
}

export default function PerfilPage() {
  const router = useRouter();
  const { usuario: usuarioSessao, sair } = useAuth();
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioSessao);
  const [carregando, setCarregando] = useState(true);

  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [agua, setAgua] = useState("");
  const [energia, setEnergia] = useState("");
  const [salvandoTarifas, setSalvandoTarifas] = useState(false);
  const [erroTarifas, setErroTarifas] = useState<string | null>(null);
  const [okTarifas, setOkTarifas] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await api.getMe();
        if (ativo) setUsuario(dados);
      } catch {
        if (ativo) setUsuario(usuarioSessao);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    (async () => {
      try {
        const lista = await api.getTarifas();
        if (!ativo) return;
        setTarifas(lista);
        setAgua(String(valorTarifa(lista, "agua") ?? ""));
        setEnergia(String(valorTarifa(lista, "energia") ?? ""));
      } catch {
        // tarifas opcionais — mantém os campos vazios
      }
    })();

    return () => {
      ativo = false;
    };
  }, [usuarioSessao]);

  async function salvarTarifas() {
    const aguaNum = Number(agua.replace(",", "."));
    const energiaNum = Number(energia.replace(",", "."));
    if (Number.isNaN(aguaNum) || Number.isNaN(energiaNum) || aguaNum <= 0 || energiaNum <= 0) {
      setErroTarifas("Informe valores numéricos maiores que zero.");
      return;
    }
    setSalvandoTarifas(true);
    setErroTarifas(null);
    setOkTarifas(false);
    try {
      const lista = await api.salvarTarifas({ agua: aguaNum, energia: energiaNum });
      setTarifas(lista);
      setOkTarifas(true);
    } catch (e) {
      setErroTarifas(e instanceof Error ? e.message : "Não foi possível salvar as tarifas.");
    } finally {
      setSalvandoTarifas(false);
    }
  }

  function confirmarSaida() {
    if (!window.confirm("Sair da conta? Você precisará entrar novamente para acessar seus dados.")) return;
    sair();
    router.replace("/login");
  }

  if (carregando) return <Carregando texto="Carregando perfil..." />;

  return (
    <div>
      {/* Hero */}
      <section className="mb-7 rounded-3xl bg-floresta px-5 py-8 text-center">
        <span className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#b6d8ae] text-[24px] font-extrabold text-floresta">
          {iniciais(usuario?.nome)}
        </span>
        <p className="mt-3.5 text-[22px] font-bold text-white">{usuario?.nome || "EcoMonitor"}</p>
        <p className="mt-1.5 text-[13px] text-[#c7d6cf]">{usuario?.email || "Sua conta ECoM"}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-verde">
          <LeafIcone />
          Monitoramento ativo
        </span>
      </section>

      {/* Dados da conta */}
      <h2 className="mb-2.5 text-[15px] font-bold text-texto">Dados da conta</h2>
      <div className="mb-6 rounded-2xl border border-linha bg-superficie px-4">
        <Linha titulo="E-mail" valor={usuario?.email || "Não informado"} />
        <div className="ml-[50px] h-px bg-linha" />
        <Linha titulo="Telefone" valor={usuario?.telefone || "Não informado"} />
      </div>

      {/* Tarifas */}
      <h2 className="mb-2.5 text-[15px] font-bold text-texto">Tarifas de consumo</h2>
      <div className="mb-6 rounded-2xl border border-linha bg-superficie p-4">
        <p className="mb-4 text-xs leading-relaxed text-texto-suave">
          Valores usados para estimar custos de água (R$/m³) e energia (R$/kWh) em todo o painel.
        </p>
        <Campo
          label="Água (R$/m³)"
          inputMode="decimal"
          placeholder="Ex: 5.82"
          value={agua}
          onChange={(e) => {
            setAgua(e.target.value);
            setOkTarifas(false);
          }}
        />
        <Campo
          label="Energia (R$/kWh)"
          inputMode="decimal"
          placeholder="Ex: 0.65"
          value={energia}
          onChange={(e) => {
            setEnergia(e.target.value);
            setOkTarifas(false);
          }}
        />
        {erroTarifas ? <p className="mb-3 text-xs text-perigo">{erroTarifas}</p> : null}
        {okTarifas ? (
          <p className="mb-3 text-xs font-semibold text-verde">Tarifas atualizadas com sucesso.</p>
        ) : null}
        <Botao onClick={salvarTarifas} carregando={salvandoTarifas}>
          Salvar tarifas
        </Botao>
      </div>

      {/* Sobre */}
      <h2 className="mb-2.5 text-[15px] font-bold text-texto">Sobre o ECoM</h2>
      <div className="mb-6 rounded-2xl border border-linha bg-superficie px-4">
        <Linha titulo="Integração" valor="Sensores e simulador" />
        <div className="ml-[50px] h-px bg-linha" />
        <Linha titulo="Privacidade" valor="Dados da sua conta" />
      </div>

      {/* Sair */}
      <button
        onClick={confirmarSaida}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f5d4d4] bg-perigo-claro p-4 text-sm font-bold text-perigo transition-colors hover:bg-[#f3dcdc]"
      >
        <SairIcone />
        Sair da conta
      </button>

      <p className="mt-4 text-center text-[11px] text-texto-suave">
        {tarifas.length > 0 ? "Tarifas sincronizadas com a API." : "Ajuste as tarifas conforme sua concessionária."}
      </p>
    </div>
  );
}

function Linha({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex items-center py-3.5">
      <span className="mr-3 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-verde-claro text-verde">
        <UserIcone />
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs text-texto-suave">{titulo}</p>
        <p className="truncate text-sm font-semibold text-texto">{valor}</p>
      </div>
    </div>
  );
}

function LeafIcone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function UserIcone() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SairIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
