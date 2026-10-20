"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const LINKS = [
  { href: "/inicio", label: "Início" },
  { href: "/dashboard", label: "Análises" },
  { href: "/controles", label: "Controles" },
  { href: "/ambientes", label: "Ambientes" },
  { href: "/alertas", label: "Alertas" },
];

const iniciais = (nome = "") =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "EC";

export default function NavBar() {
  const { usuario } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-linha bg-superficie/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/inicio" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-floresta">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-verde text-white">
            <LeafMark />
          </span>
          ECoM
        </Link>

        <div className="hidden gap-1 md:flex">
          {LINKS.map((l) => {
            const ativo = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  ativo ? "bg-verde-claro text-floresta" : "text-texto-suave hover:text-texto"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/perfil"
            className="flex items-center gap-2 rounded-full border border-linha bg-superficie py-1 pl-1 pr-3 transition-colors hover:border-verde"
            title="Minha conta"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-verde-claro text-xs font-extrabold text-floresta">
              {iniciais(usuario?.nome)}
            </span>
            <span className="hidden max-w-[140px] truncate text-sm font-semibold text-texto sm:block">
              {usuario?.nome ?? "Conta"}
            </span>
          </Link>
        </div>
      </div>

      {/* Tabs inferiores no mobile, espelhando o app */}
      <div className="flex gap-1 overflow-x-auto border-t border-linha px-2 py-1.5 md:hidden">
        {LINKS.map((l) => {
          const ativo = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                ativo ? "bg-verde-claro text-floresta" : "text-texto-suave"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function LeafMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}
