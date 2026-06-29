import type { LoginRequest, LoginResponse, Usuario, UsuarioRequest } from '../types/api';
import { requestWithRetry } from './apiClient';

export const authService = {
  login(payload: LoginRequest, signal?: AbortSignal) {
    return requestWithRetry<LoginResponse>({
      url: '/usuarios/login',
      method: 'POST',
      data: payload,
      signal
    });
  },
  register(payload: UsuarioRequest, signal?: AbortSignal) {
    return requestWithRetry<Usuario>({
      url: '/usuarios/register',
      method: 'POST',
      data: payload,
      signal
    });
  }
};
