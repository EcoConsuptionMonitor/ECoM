"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { entrar } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [visivel, setVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEntrar() {
    if (!email.trim() || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      await entrar(email.trim(), senha);
      router.replace("/inicio");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-fundo px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-verde text-white">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </span>
          <h1 className="text-[26px] font-extrabold tracking-tight text-texto">Que bom te ver de novo</h1>
          <p className="mt-2 text-sm text-texto-suave">Entre para acompanhar o consumo da sua casa.</p>
        </div>

        <div className="rounded-3xl border border-linha bg-superficie p-6 shadow-sm">
          <Campo
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Campo
            label="Senha"
            type={visivel ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            className="-mt-2 mb-4 text-xs font-semibold text-texto-suave hover:text-texto"
          >
            {visivel ? "Ocultar senha" : "Mostrar senha"}
          </button>

          {erro ? (
            <div className="mb-4 flex items-start gap-2 rounded-2xl bg-perigo-claro px-3 py-2.5">
              <AlertIcone />
              <p className="text-[13px] leading-snug text-perigo">{erro}</p>
            </div>
          ) : null}

          <Botao onClick={aoEntrar} carregando={carregando}>
            Entrar
          </Botao>
        </div>

        <p className="mt-6 text-center text-sm text-texto-suave">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" replace className="font-extrabold text-verde hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  );
}

function AlertIcone() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}
