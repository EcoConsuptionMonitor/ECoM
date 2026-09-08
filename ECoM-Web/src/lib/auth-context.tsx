"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { api } from "./api";

type Usuario = { id: string; nome: string; email: string };

type AuthContextType = {
  token: string | null;
  usuario: Usuario | null;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: { nome: string; email: string; telefone?: string; senha: string }) => Promise<void>;
  sair: () => void;
};

const TOKEN_KEY = "ecom_token";
const USUARIO_KEY = "ecom_usuario";

function carregarUsuario(): Usuario | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USUARIO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  });
  const [usuario, setUsuario] = useState<Usuario | null>(() => carregarUsuario());

  function persistir(authToken: string, usuarioDados: { id: string; nome: string; email: string }) {
    window.localStorage.setItem(TOKEN_KEY, authToken);
    window.localStorage.setItem(USUARIO_KEY, JSON.stringify(usuarioDados));
    setToken(authToken);
    setUsuario(usuarioDados);
  }

  const entrar = useCallback(async (email: string, senha: string) => {
    const data = await api<{ token: string; usuario: Usuario }>("/auth/login", {
      method: "POST",
      body: { email, senha },
    });
    persistir(data.token, data.usuario);
  }, []);

  const cadastrar = useCallback(
    async (dados: { nome: string; email: string; telefone?: string; senha: string }) => {
      const data = await api<{ token: string; usuario: Usuario }>("/auth/register", {
        method: "POST",
        body: dados,
      });
      persistir(data.token, data.usuario);
    },
    []
  );

  const sair = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USUARIO_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, usuario, entrar, cadastrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}