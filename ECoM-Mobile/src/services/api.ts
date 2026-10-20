import { Platform } from 'react-native';
import { getToken } from './session';
import type {
  Alerta,
  Ambiente,
  Consumo,
  Dashboard,
  LeituraSensorResposta,
  SessaoResposta,
  Sensor,
  Tarifa,
  TipoConsumo,
  Usuario,
} from '../types';

function obterBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  if (Platform.OS === 'android') return 'http://10.0.2.2:3333';
  return 'http://localhost:3333';
}

export const API_BASE_URL = obterBaseUrl();

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(mensagem: string, status: number, data: unknown) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

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
  register(dados: { nome: string; email: string; senha: string; telefone?: string }) {
    return apiFetch<SessaoResposta>('/auth/register', { method: 'POST', body: json(dados) });
  },

  login(email: string, senha: string) {
    return apiFetch<SessaoResposta>('/auth/login', { method: 'POST', body: json({ email, senha }) });
  },

  getMe() {
    return apiFetch<Usuario>('/auth/me');
  },

  getAmbientes() {
    return apiFetch<Ambiente[]>('/ambientes');
  },

  getAmbiente(id: string) {
    return apiFetch<Ambiente>(`/ambientes/${id}`);
  },

  createAmbiente(dados: { nome: string; localizacao?: string; descricao?: string }) {
    return apiFetch<Ambiente>('/ambientes', { method: 'POST', body: json(dados) });
  },

  updateAmbiente(id: string, dados: { nome?: string; localizacao?: string; descricao?: string }) {
    return apiFetch<Ambiente>(`/ambientes/${id}`, { method: 'PATCH', body: json(dados) });
  },

  deleteAmbiente(id: string) {
    return apiFetch<void>(`/ambientes/${id}`, { method: 'DELETE' });
  },

  getConsumo(params: { tipo?: TipoConsumo; ambienteId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.tipo) query.set('tipo', params.tipo);
    if (params.ambienteId) query.set('ambienteId', params.ambienteId);
    const qs = query.toString();
    return apiFetch<Consumo[]>(`/consumo${qs ? `?${qs}` : ''}`);
  },

  createConsumo(dados: { ambienteId: string; tipo: TipoConsumo; valor: number; unidade?: string; data?: string }) {
    return apiFetch<Consumo>('/consumo', { method: 'POST', body: json(dados) });
  },

  getDashboard() {
    return apiFetch<Dashboard>('/dashboard');
  },

  getAlertas() {
    return apiFetch<Alerta[]>('/alertas');
  },

  marcarAlertaLido(id: string) {
    return apiFetch<Alerta>(`/alertas/${id}`, { method: 'PATCH', body: json({ lido: true }) });
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
    return apiFetch<LeituraSensorResposta>('/sensores', { method: 'POST', body: json(dados) });
  },

  getUltimosSensores(ambienteId: string) {
    return apiFetch<Sensor[]>(`/sensores/ultimas/${ambienteId}`);
  },

  getTarifas() {
    return apiFetch<Tarifa[]>('/tarifas');
  },

  salvarTarifas(dados: { agua?: number; energia?: number }) {
    return apiFetch<Tarifa[]>('/tarifas', { method: 'PUT', body: json(dados) });
  },
};
