"use client";

import { type ReactNode } from "react";
import NavBar from "@/components/NavBar";
import { Protegida } from "@/components/Protegida";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Protegida>
      <div className="flex min-h-full flex-col bg-fundo">
        <NavBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </Protegida>
  );
}
