import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { tokenStore } from '../services/tokenStore';
import type { LoginRequest, Rol, UsuarioRequest } from '../types/api';
import { getFriendlyError } from '../utils/errors';
import { decodeJwt, isJwtExpired } from '../utils/jwt';

interface SessionUser {
  email: string;
  userId: number;
  rol: Rol;
}

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (payload: LoginRequest, signal?: AbortSignal) => Promise<void>;
  register: (payload: UsuarioRequest, signal?: AbortSignal) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function userFromToken(token: string | null): SessionUser | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload || isJwtExpired(payload)) return null;
  return { email: payload.sub, userId: payload.userId, rol: payload.rol };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => userFromToken(tokenStore.getAccessToken()));
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (payload: LoginRequest, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await authService.login(payload, signal);
      tokenStore.setAccessToken(response.token);
      const nextUser = userFromToken(response.token);
      if (!nextUser) throw new Error('No se pudo leer la sesion recibida del servidor.');
      setUser(nextUser);
    } catch (error) {
      throw new Error(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: UsuarioRequest, signal?: AbortSignal) => {
    setLoading(true);
    try {
      await authService.register(payload, signal);
    } catch (error) {
      throw new Error(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.rol === 'ADMIN',
      loading,
      login,
      register,
      logout
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
