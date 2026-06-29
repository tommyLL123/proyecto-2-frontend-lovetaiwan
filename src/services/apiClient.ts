import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { tokenStore } from './tokenStore';

// El backend expone todo bajo /api/v1 (ver controllers: @RequestMapping("/api/v1/...")).
// En local usamos una ruta relativa (/api/v1) para que Vite proxy evite CORS.
// Si defines VITE_API_URL, tambien puedes apuntar a una URL absoluta.
const baseURL = import.meta.env.VITE_API_URL?.trim() || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// El backend emite un JWT simple sin refresh token (LoginResponseDTO solo tiene "token").
// Por eso, ante un 401 no intentamos refrescar: limpiamos la sesion para que
// el PrivateRoute redirija a /login limpiamente en el siguiente render.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStore.clear();
    }
    return Promise.reject(error);
  }
);

export async function requestWithRetry<T>(config: AxiosRequestConfig, retries = 1): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    // Solo reintenta errores transitorios (sin respuesta o 5xx). Nunca reintenta 4xx.
    if (retries > 0 && (!status || status >= 500)) return requestWithRetry<T>(config, retries - 1);
    throw error;
  }
}
