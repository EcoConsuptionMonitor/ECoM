"use client";

import { useId, type InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  erro?: string | null;
}

export function Campo({ label, erro, className = "", id, ...rest }: Props) {
  const idGerado = useId();
  const campoId = id ?? idGerado;
  return (
    <div className="mb-4">
      <label htmlFor={campoId} className="mb-1.5 block text-[13px] font-bold text-texto">
        {label}
      </label>
      <input
        id={campoId}
        {...rest}
        className={`w-full rounded-2xl border bg-superficie px-4 py-3 text-[15px] text-texto outline-none transition-colors placeholder:text-texto-suave focus:border-verde ${
          erro ? "border-perigo" : "border-linha"
        } ${className}`}
      />
      {erro ? <p className="mt-1 text-xs text-perigo">{erro}</p> : null}
    </div>
  );
}
