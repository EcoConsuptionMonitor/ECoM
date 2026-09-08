let token = null;
let usuario = null;

export function setSession(newToken, newUsuario) {
  token = newToken;
  usuario = newUsuario;
}

export function clearSession() {
  token = null;
  usuario = null;
}

export function getToken() {
  return token;
}

export function getUsuario() {
  return usuario;
}
