// El backend solo emite un access token simple (LoginResponseDTO { token }), sin refresh token.
// Usamos sessionStorage (no localStorage) para que la sesion no persista entre pestanas/cierres
// del navegador de forma indefinida, reduciendo la ventana de exposicion del token.
const ACCESS_TOKEN_KEY = 'sellio_access_token';

let accessToken: string | null = sessionStorage.getItem(ACCESS_TOKEN_KEY);

export const tokenStore = {
  getAccessToken: () => accessToken,
  setAccessToken: (next: string | null) => {
    accessToken = next;
    if (accessToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    else sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  },
  clear: () => {
    accessToken = null;
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};
