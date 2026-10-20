interface Props {
  /** Caminho do SVG em /public (ex.: "/icons/leaf.svg") ou nada para o ícone padrão. */
  icone?: string;
  titulo: string;
  descricao?: string;
}

export function Vazio({ icone, titulo, descricao }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-linha bg-superficie px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verde-claro text-verde">
        {icone ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icone} alt="" className="h-7 w-7" />
        ) : (
          <LeafIcone />
        )}
      </div>
      <p className="text-[15px] font-bold text-texto">{titulo}</p>
      {descricao ? <p className="max-w-sm text-[13px] leading-relaxed text-texto-suave">{descricao}</p> : null}
    </div>
  );
}

function LeafIcone() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}
