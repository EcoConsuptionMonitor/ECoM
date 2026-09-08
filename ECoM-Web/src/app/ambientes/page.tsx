"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { api, type Ambiente } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AmbientesPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Ambiente | null>(null);
  const [nome, setNome] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/");
      return;
    }
    let ativo = true;
    api<Ambiente[]>("/ambientes", { token })
      .then((data) => {
        if (ativo) setAmbientes(data);
      })
      .catch(() => {
        if (ativo) setAmbientes([]);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [token, router]);

  async function recarregar() {
    await api<Ambiente[]>("/ambientes", { token: token! }).then(setAmbientes);
  }

  function abrirNovo() {
    setEditando(null);
    setNome("");
    setLocalizacao("");
    setDescricao("");
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(amb: Ambiente) {
    setEditando(amb);
    setNome(amb.nome);
    setLocalizacao(amb.localizacao ?? "");
    setDescricao(amb.descricao ?? "");
    setErro("");
    setModalAberto(true);
  }

  async function salvar() {
    if (!nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const body = { nome: nome.trim(), localizacao: localizacao.trim(), descricao: descricao.trim() };
      if (editando) {
        await api(`/ambientes/${editando.id}`, { method: "PATCH", token: token!, body });
      } else {
        await api("/ambientes", { method: "POST", token: token!, body });
      }
      setModalAberto(false);
      await recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este ambiente?")) return;
    try {
      await api(`/ambientes/${id}`, { method: "DELETE", token: token! });
      setAmbientes((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  const inputCls =
    "w-full rounded-lg bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[#c8ff00]";

  if (!token) return null;

  return (
    <div className="min-h-full flex-1 bg-[#1e2d27]">
      <NavBar />
      <main className="mx-auto max-w-6xl p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Ambientes</h1>
            <p className="text-sm text-white/50">Gerencie os ambientes da sua casa</p>
          </div>
          <button
            onClick={abrirNovo}
            className="rounded-full bg-[#c8ff00] px-5 py-2 font-medium text-[#1e2d27] hover:bg-[#dcff4d]"
          >
            Novo ambiente
          </button>
        </header>

        {carregando ? (
          <div className="flex items-center justify-center py-32 text-white/60">Carregando...</div>
        ) : ambientes.length === 0 ? (
          <div className="rounded-2xl bg-black p-12 text-center">
            <p className="text-white/60">Nenhum ambiente cadastrado.</p>
            <p className="mt-1 text-sm text-white/40">Clique em &quot;Novo ambiente&quot; para começar.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ambientes.map((amb) => (
              <div key={amb.id} className="rounded-2xl bg-black p-5 shadow-lg">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">{amb.nome}</h2>
                    {amb.localizacao && <p className="text-xs text-white/40">{amb.localizacao}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirEdicao(amb)}
                      className="rounded-lg p-1.5 text-[#c8ff00] hover:bg-white/10"
                      title="Editar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => excluir(amb.id)}
                      className="rounded-lg p-1.5 text-[#ff5252] hover:bg-white/10"
                      title="Excluir"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
                      </svg>
                    </button>
                  </div>
                </div>

                {amb.descricao && <p className="mb-3 text-sm italic text-white/40">{amb.descricao}</p>}

                <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center">
                  <div>
                    <p className="text-sm font-bold text-[#c8ff00]">{amb.totalEnergia ?? 0}</p>
                    <p className="text-[11px] text-white/40">kWh</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1385ef]">{amb.totalAgua ?? 0}</p>
                    <p className="text-[11px] text-white/40">L</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/80">{amb.totalRegistros ?? 0}</p>
                    <p className="text-[11px] text-white/40">registros</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalAberto && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1e2d27] p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-white">
              {editando ? "Editar ambiente" : "Novo ambiente"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-white/60">Nome *</label>
                <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Cozinha" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60">Localização</label>
                <input
                  className={inputCls}
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                  placeholder="Ex: Térreo"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60">Descrição</label>
                <input
                  className={inputCls}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              {erro && <p className="text-sm text-red-400">{erro}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setModalAberto(false)}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="rounded-full bg-[#c8ff00] px-5 py-2 text-sm font-medium text-[#1e2d27] hover:bg-[#dcff4d] disabled:opacity-60"
              >
                {salvando ? "Salvando..." : editando ? "Atualizar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}