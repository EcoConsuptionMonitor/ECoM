"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function NavBar() {
  const { usuario, sair } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/ambientes", label: "Ambientes" },
  ];

  return (
    <nav className="sticky top-0 z-10 border-b border-white/10 bg-[#1e2d27]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-[#c8ff00]">ECoM</span>
          <div className="flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  pathname === l.href
                    ? "bg-[#c8ff00] text-[#1e2d27] font-medium"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {usuario && <span className="text-sm text-white/70">{usuario.nome}</span>}
          <button
            onClick={sair}
            className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/80 transition-colors hover:text-white"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}