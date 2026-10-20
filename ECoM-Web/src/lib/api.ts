import type {
  Alerta,
  Ambiente,
  Dashboard,
  LeituraSensorResposta,
  SessaoResposta,
  Tarifa,
  TipoConsumo,
  Usuario,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(mensagem: string, status: number, data: unknown) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/** Token em memória — evita ler localStorage durante o render do servidor. */
let tokenMemoria: string | null = null;

export function definirToken(token: string | null) {
  tokenMemoria = token;
}

export function obterToken() {
  return tokenMemoria;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (tokenMemoria) headers.Authorization = `Bearer ${tokenMemoria}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const erro = data as { erro?: string; message?: string } | null;
    const mensagem = erro?.erro || erro?.message || `Erro ${response.status}`;
    throw new ApiError(mensagem, response.status, data);
  }

  return data as T;
}

function json(body: unknown): string {
  return JSON.stringify(body);
}

export const api = {
  login(email: string, senha: string) {
    return apiFetch<SessaoResposta>("/auth/login", { method: "POST", body: json({ email, senha }) });
  },

  register(dados: { nome: string; email: string; senha: string; telefone?: string }) {
    return apiFetch<SessaoResposta>("/auth/register", { method: "POST", body: json(dados) });
  },

  getMe() {
    return apiFetch<Usuario>("/auth/me");
  },

  getAmbientes() {
    return apiFetch<Ambiente[]>("/ambientes");
  },

  createAmbiente(dados: { nome: string; localizacao?: string; descricao?: string }) {
    return apiFetch<Ambiente>("/ambientes", { method: "POST", body: json(dados) });
  },

  updateAmbiente(id: string, dados: { nome?: string; localizacao?: string; descricao?: string }) {
    return apiFetch<Ambiente>(`/ambientes/${id}`, { method: "PATCH", body: json(dados) });
  },

  deleteAmbiente(id: string) {
    return apiFetch<void>(`/ambientes/${id}`, { method: "DELETE" });
  },

  getDashboard() {
    return apiFetch<Dashboard>("/dashboard");
  },

  getAlertas() {
    return apiFetch<Alerta[]>("/alertas");
  },

  marcarAlertaLido(id: string) {
    return apiFetch<Alerta>(`/alertas/${id}`, { method: "PATCH", body: json({ lido: true }) });
  },

  enviarSensor(dados: {
    ambienteId: string;
    tipo: TipoConsumo;
    valor: number;
    unidade?: string;
    potencia?: number;
    corrente?: number;
    tensao?: number;
  }) {
    return apiFetch<LeituraSensorResposta>("/sensores", { method: "POST", body: json(dados) });
  },

  getTarifas() {
    return apiFetch<Tarifa[]>("/tarifas");
  },

  salvarTarifas(dados: { agua?: number; energia?: number }) {
    return apiFetch<Tarifa[]>("/tarifas", { method: "PUT", body: json(dados) });
  },
};
