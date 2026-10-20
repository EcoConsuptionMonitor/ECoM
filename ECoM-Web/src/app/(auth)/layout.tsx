"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Carregando } from "@/components/Carregando";
import { useAuth } from "@/lib/auth-context";

/** Layout das telas públicas: leva o usuário já autenticado para o início. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const { token, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && token) router.replace("/inicio");
  }, [carregando, token, router]);

  if (carregando) return <Carregando />;

  return <>{children}</>;
}
