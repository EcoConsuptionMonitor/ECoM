const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export type Consumo = {
  id: string;
  tipo: "agua" | "energia";
  valor: number;
  unidade: string;
  data: string;
};

export type Alerta = {
  id: string;
  mensagem: string;
  nivel: "info" | "alerta" | "critico";
  tipo: string;
  lido: boolean;
  data: string;
};

export type Ambiente = {
  id: string;
  nome: string;
  localizacao?: string | null;
  descricao?: string | null;
  criadoEm: string;
  totalAgua?: number;
  totalEnergia?: number;
  totalRegistros?: number;
};

export type DashboardData = {
  totais: {
    agua: number;
    energia: number;
    custoAgua: number;
    custoEnergia: number;
    custoTotal: number;
  };
  mes: { agua: number; energia: number };
  alertas: { ativos: number; criticos: number };
  ambientes: number;
  historico: { dia: string; agua: number; energia: number }[];
  consumoPorAmbiente: { ambienteId: string; nome: string; agua: number; energia: number }[];
  alertasRecentes: Alerta[];
  tarifas: { agua: number; energia: number };
};

export async function api<T>(
  path: string,
  { method = "GET", body, token }: { method?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.erro) || `Erro ${res.status}`);
  return data as T;
}