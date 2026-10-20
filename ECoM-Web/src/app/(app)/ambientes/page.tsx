"use client";

import { useEffect, useState } from "react";
import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { Carregando } from "@/components/Carregando";
import { Vazio } from "@/components/Vazio";
import { api } from "@/lib/api";
import type { Ambiente } from "@/lib/types";

function iconeAmbiente(nome: string): React.ReactNode {
  const n = nome.toLowerCase();
  if (n.includes("quarto") || n.includes("bedroom")) return <CamaIcone />;
  if (n.includes("cozinha") || n.includes("kitchen")) return <CozinhaIcone />;
  if (n.includes("banheiro") || n.includes("bath")) return <AguaIcone />;
  if (n.includes("sala") || n.includes("living")) return <TvIcone />;
  if (n.includes("lavanderia") || n.includes("laundry")) return <LavanderiaIcone />;
  if (n.includes("jardim") || n.includes("garden")) return <FolhaIcone />;
  return <CasaIcone />;
}

export default function AmbientesPage() {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    try {
      const dados = await api.getAmbientes();
      setAmbientes(dados);
    } catch {
      setAmbientes([]);
    }
  }

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
  }, []);

  function limparForm() {
    setNome("");
    setLocalizacao("");
    setDescricao("");
    setEditandoId(null);
    setErro(null);
    setModalAberto(false);
  }

  function abrirCriacao() {
    limparForm();
    setModalAberto(true);
  }

  function abrirEdicao(amb: Ambiente) {
    setNome(amb.nome);
    setLocalizacao(amb.localizacao ?? "");
    setDescricao(amb.descricao ?? "");
    setEditandoId(amb.id);
    setErro(null);
    setModalAberto(true);
  }

  async function salvar() {
    if (!nome.trim()) {
      setErro("O nome do ambiente é obrigatório.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const dados = { nome: nome.trim(), localizacao: localizacao.trim(), descricao: descricao.trim() };
      if (editandoId) {
        await api.updateAmbiente(editandoId, dados);
      } else {
        await api.createAmbiente(dados);
      }
      limparForm();
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este ambiente?")) return;
    try {
      await api.deleteAmbiente(id);
      setAmbientes((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
  }

  if (carregando) return <Carregando texto="Carregando ambientes..." />;

  return (
    <div>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-texto">Ambientes</h1>
          <p className="mt-1 text-[13px] text-texto-suave">
            {ambientes.length} ambiente(s) cadastrado(s)
          </p>
        </div>
        <button
          onClick={abrirCriacao}
          aria-label="Adicionar ambiente"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-verde text-white transition-colors hover:bg-[#357a55]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </header>

      {ambientes.length === 0 ? (
        <Vazio
          titulo="Nenhum ambiente cadastrado"
          descricao="Toque em + para adicionar o primeiro ambiente da sua casa."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ambientes.map((amb) => (
            <article key={amb.id} className="rounded-3xl border border-linha bg-superficie p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-verde-claro text-verde">
                  {iconeAmbiente(amb.nome)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold text-texto">{amb.nome}</h2>
                  {amb.localizacao ? <p className="truncate text-xs text-texto-suave">{amb.localizacao}</p> : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => abrirEdicao(amb)}
                    aria-label="Editar"
                    className="rounded-xl p-2 text-verde transition-colors hover:bg-verde-claro"
                  >
                    <PencilIcone />
                  </button>
                  <button
                    onClick={() => excluir(amb.id)}
                    aria-label="Excluir"
                    className="rounded-xl p-2 text-perigo transition-colors hover:bg-perigo-claro"
                  >
                    <TrashIcone />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-linha pt-4">
                <Stat icone={<EnergiaIcone />} cor="text-verde" texto={`${Number(amb.totalEnergia ?? 0).toFixed(1)} kWh`} />
                <Stat icone={<AguaIcone />} cor="text-agua" texto={`${Number(amb.totalAgua ?? 0).toFixed(0)} L`} />
                <Stat icone={<DocIcone />} cor="text-texto-suave" texto={`${amb.totalRegistros ?? 0} registros`} />
              </div>

              {amb.descricao ? (
                <p className="mt-3 text-xs italic leading-relaxed text-texto-suave">{amb.descricao}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-[rgba(22,53,43,0.45)] p-4">
          <div className="w-full max-w-md rounded-3xl bg-superficie p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-extrabold text-texto">
              {editandoId ? "Editar Ambiente" : "Novo Ambiente"}
            </h2>
            <Campo
              label="Nome"
              placeholder="Ex: Cozinha"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <Campo
              label="Localização"
              placeholder="Ex: Térreo"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
            />
            <Campo
              label="Descrição (opcional)"
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            {erro ? <p className="mb-3 text-xs text-perigo">{erro}</p> : null}
            <div className="mt-2 flex justify-end gap-3">
              <Botao variante="fantasma" className="w-auto px-5" onClick={limparForm}>
                Cancelar
              </Botao>
              <Botao className="w-auto min-w-[110px] px-5" onClick={salvar} carregando={salvando}>
                {editandoId ? "Atualizar" : "Criar"}
              </Botao>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icone, cor, texto }: { icone: React.ReactNode; cor: string; texto: string }) {
  return (
    <span className={`flex items-center gap-1.5 text-[13px] ${cor}`}>
      {icone}
      <span className="truncate text-texto-suave">{texto}</span>
    </span>
  );
}

function CasaIcone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function CamaIcone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CozinhaIcone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  );
}

function TvIcone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="m17 2-5 5-5-5" />
    </svg>
  );
}

function LavanderiaIcone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}

function FolhaIcone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function AguaIcone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function EnergiaIcone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function DocIcone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8" />
    </svg>
  );
}

function PencilIcone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function TrashIcone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
    </svg>
  );
}
