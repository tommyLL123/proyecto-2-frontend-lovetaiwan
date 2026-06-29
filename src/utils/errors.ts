import axios from 'axios';
import type { ApiErrorBody } from '../types/api';

const messages: Record<number, string> = {
  400: 'Revisa los datos ingresados.',
  401: 'Tu sesion expiro. Inicia sesion nuevamente.',
  403: 'No tienes permisos para realizar esta accion.',
  404: 'No encontramos el recurso solicitado.',
  409: 'Ya existe un registro con esos datos.',
  500: 'El servidor tuvo un problema. Intenta otra vez en unos minutos.'
};

export function getFriendlyError(error: unknown): string {
  if (axios.isCancel(error)) return 'Solicitud cancelada.';
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'No hay conexion a internet.';
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const status = error.response?.status;
    const backendMessage = error.response?.data?.message ?? error.response?.data?.error;
    if (backendMessage && typeof backendMessage === 'string') return backendMessage;
    if (status && messages[status]) return messages[status];
    if (!error.response) return 'No se pudo conectar con el servidor. Intenta otra vez.';
  }
  // Errores que nosotros mismos lanzamos en el codigo (no provenientes de axios)
  // ya tienen un mensaje pensado para mostrarse tal cual.
  if (error instanceof Error && error.message) return error.message;
  return 'No se pudo completar la operacion. Vuelve a intentarlo.';
}
