import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import {
  atualizarUsuario,
  carregarSessao,
  getUsuario as lerUsuarioSessao,
  getToken as lerTokenSessao,
  limparSessao,
  salvarSessao,
} from '../services/session';
import type { Usuario } from '../types';

interface AuthContextValue {
  carregando: boolean;
  autenticado: boolean;
  usuario: Usuario | null;
  entrar: (email: string, senha: string) => Promise<void>;
  registrar: (dados: { nome: string; email: string; senha: string; telefone?: string }) => Promise<void>;
  sair: () => Promise<void>;
  recarregarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { token, usuario: salvo } = await carregarSessao();
      if (!ativo) return;
      if (token && salvo) {
        setUsuario(salvo);
        setAutenticado(true);
      }
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const resposta = await api.login(email, senha);
    await salvarSessao(resposta.token, resposta.usuario);
    setUsuario(resposta.usuario);
    setAutenticado(true);
  }, []);

  const registrar = useCallback(
    async (dados: { nome: string; email: string; senha: string; telefone?: string }) => {
      const resposta = await api.register(dados);
      await salvarSessao(resposta.token, resposta.usuario);
      setUsuario(resposta.usuario);
      setAutenticado(true);
    },
    []
  );

  const sair = useCallback(async () => {
    await limparSessao();
    setUsuario(null);
    setAutenticado(false);
  }, []);

  const recarregarUsuario = useCallback(async () => {
    if (!lerTokenSessao()) return;
    try {
      const completo = await api.getMe();
      await atualizarUsuario(completo);
      setUsuario(completo);
    } catch {
      const atual = lerUsuarioSessao();
      if (atual) setUsuario(atual);
    }
  }, []);

  const valor = useMemo(
    () => ({ carregando, autenticado, usuario, entrar, registrar, sair, recarregarUsuario }),
    [carregando, autenticado, usuario, entrar, registrar, sair, recarregarUsuario]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return contexto;
}
