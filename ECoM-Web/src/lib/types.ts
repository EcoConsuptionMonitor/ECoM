export type NivelAlerta = "info" | "alerta" | "critico";
export type TipoConsumo = "agua" | "energia";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
}

export interface SessaoResposta {
  token: string;
  usuario: Usuario;
}

export interface Ambiente {
  id: string;
  userId: string;
  nome: string;
  localizacao: string | null;
  descricao: string | null;
  criadoEm: string | null;
  totalAgua?: number;
  totalEnergia?: number;
  totalRegistros?: number;
}

export interface Consumo {
  id: string;
  userId: string;
  ambienteId: string;
  tipo: TipoConsumo;
  valor: number;
  unidade: string | null;
  fonte: string;
  data: string;
}

export interface Alerta {
  id: string;
  userId: string;
  mensagem: string;
  nivel: NivelAlerta;
  tipo: string;
  lido: boolean;
  data: string;
}

export interface Sensor {
  id: string;
  userId: string;
  ambienteId: string;
  tipo: TipoConsumo;
  valor: number;
  unidade: string | null;
  potencia: number | null;
  corrente: number | null;
  tensao: number | null;
  data: string;
}

export interface LeituraSensorResposta {
  leitura: Sensor;
  registro: Consumo;
  totais: { consumoTotal: number; custoTotal: number };
}

export interface PontoHistorico {
  dia: string;
  agua: number;
  energia: number;
}

export interface ConsumoPorAmbiente {
  ambienteId: string;
  nome: string;
  agua: number;
  energia: number;
}

export interface Dashboard {
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
  historico: PontoHistorico[];
  consumoPorAmbiente: ConsumoPorAmbiente[];
  alertasRecentes: Alerta[];
  tarifas: { agua: number; energia: number };
}

export interface Tarifa {
  id: string;
  userId: string;
  tipo: TipoConsumo;
  nome: string | null;
  valorPorUnidade: number;
  unidade: string | null;
  criadoEm: string | null;
  atualizadoEm: string | null;
}
