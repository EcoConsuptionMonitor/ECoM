import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "perigo" | "fantasma" | "contorno";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-verde text-white hover:bg-[#357a55]",
  secundario: "bg-verde-claro text-verde hover:bg-[#d7ecdd]",
  perigo: "bg-perigo-claro text-perigo hover:bg-[#f3dcdc]",
  fantasma: "bg-transparent text-texto-suave hover:text-texto",
  contorno: "border border-linha bg-superficie text-texto hover:border-verde",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  carregando?: boolean;
  desabilitado?: boolean;
}

export function Botao({ variante = "primario", carregando, desabilitado, className = "", children, ...rest }: Props) {
  const inativo = desabilitado || carregando;
  return (
    <button
      {...rest}
      disabled={inativo}
      className={`flex min-h-[48px] w-full items-center justify-center rounded-2xl px-5 text-[15px] font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${VARIANTES[variante]} ${className}`}
    >
      {carregando ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </button>
  );
}
