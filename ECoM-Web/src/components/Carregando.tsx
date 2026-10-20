interface Props {
  texto?: string;
}

export function Carregando({ texto }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-32">
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-verde border-t-transparent" />
      {texto ? <p className="text-sm text-texto-suave">{texto}</p> : null}
    </div>
  );
}
