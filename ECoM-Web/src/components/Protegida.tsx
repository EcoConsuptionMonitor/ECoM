"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Carregando } from "@/components/Carregando";
import { useAuth } from "@/lib/auth-context";

/** Guarda de rota: redireciona para /login quando não há sessão. */
export function Protegida({ children }: { children: ReactNode }) {
  const { token, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !token) router.replace("/login");
  }, [carregando, token, router]);

  if (carregando || !token) return <Carregando texto="Carregando sua sessão..." />;

  return <>{children}</>;
}
