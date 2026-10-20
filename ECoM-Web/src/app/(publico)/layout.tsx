import type { ReactNode } from "react";

/**
 * Layout das páginas públicas (landing em `/`).
 * A raiz e o painel (`/inicio`) são rotas independentes: nenhuma redireciona para a outra.
 */
export default function PublicoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
