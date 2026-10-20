"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, definirToken } from "./api";
import type { Usuario } from "./types";

type AuthContextType = {
  token: string | null;
  usuario: Usuario | null;
  /** false enquanto a sessão não é hidratada do localStorage (evita flicker/redirect indevido). */
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: { nome: string; email: string; telefone?: string; senha: string }) => Promise<void>;
  sair: () => void;
};

const TOKEN_KEY = "ecom_token";
const USUARIO_KEY = "ecom_usuario";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Hidrata a sessão só no cliente, após a montagem — evita erro de hidratação.
  // A leitura do localStorage ocorre em microtask (não síncrona no efeito),
  // para não disparar renders encadeados durante a hidratação.
  useEffect(() => {
    let ativo = true;
    queueMicrotask(() => {
      if (!ativo) return;
      try {
        const salvo = window.localStorage.getItem(TOKEN_KEY);
        const salvoUsuario = window.localStorage.getItem(USUARIO_KEY);
        if (salvo) {
          definirToken(salvo);
          setToken(salvo);
        }
        if (salvoUsuario) {
          setUsuario(JSON.parse(salvoUsuario) as Usuario);
        }
      } catch {
        // storage corrompido — ignora e segue sem sessão
      }
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const persistir = useCallback((novoToken: string, dados: Usuario) => {
    window.localStorage.setItem(TOKEN_KEY, novoToken);
    window.localStorage.setItem(USUARIO_KEY, JSON.stringify(dados));
    definirToken(novoToken);
    setToken(novoToken);
    setUsuario(dados);
  }, []);

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const data = await api.login(email, senha);
      persistir(data.token, data.usuario);
    },
    [persistir]
  );

  const cadastrar = useCallback(
    async (dados: { nome: string; email: string; telefone?: string; senha: string }) => {
      const data = await api.register(dados);
      persistir(data.token, data.usuario);
    },
    [persistir]
  );

  const sair = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USUARIO_KEY);
    definirToken(null);
    setToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, usuario, carregando, entrar, cadastrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
