/**
 * El backend (UsuarioService.login) emite un JWT con estos claims:
 *   sub      -> email del usuario
 *   userId   -> id numerico
 *   rol      -> "ADMIN" | "USER"
 *   iat/exp  -> emitido / expira (24h)
 *
 * No existe un endpoint /usuarios/me, asi que decodificamos el propio token
 * (sin verificar firma, eso ya lo hizo el backend) para reconstruir la sesion
 * del usuario en el cliente y para saber cuando expira sin hacer una llamada extra.
 */
export interface JwtPayload {
  sub: string;
  userId: number;
  rol: 'ADMIN' | 'USER';
  iat: number;
  exp: number;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(payload: JwtPayload | null): boolean {
  if (!payload) return true;
  return payload.exp * 1000 <= Date.now();
}
