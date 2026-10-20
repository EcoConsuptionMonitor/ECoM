import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Usuario } from '../types';

const CHAVE_TOKEN = 'ecom_token';
const CHAVE_USUARIO = 'ecom_usuario';

let token: string | null = null;
let usuario: Usuario | null = null;

export async function carregarSessao(): Promise<{ token: string | null; usuario: Usuario | null }> {
  const [t, u] = await AsyncStorage.multiGet([CHAVE_TOKEN, CHAVE_USUARIO]);
  token = t[1];
  usuario = u[1] ? JSON.parse(u[1]) : null;
  return { token, usuario };
}

export async function salvarSessao(novoToken: string, novoUsuario: Usuario): Promise<void> {
  token = novoToken;
  usuario = novoUsuario;
  await AsyncStorage.multiSet([
    [CHAVE_TOKEN, novoToken],
    [CHAVE_USUARIO, JSON.stringify(novoUsuario)],
  ]);
}

export async function atualizarUsuario(novoUsuario: Usuario): Promise<void> {
  usuario = novoUsuario;
  await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(novoUsuario));
}

export async function limparSessao(): Promise<void> {
  token = null;
  usuario = null;
  await AsyncStorage.multiRemove([CHAVE_TOKEN, CHAVE_USUARIO]);
}

export function getToken(): string | null {
  return token;
}

export function getUsuario(): Usuario | null {
  return usuario;
}
