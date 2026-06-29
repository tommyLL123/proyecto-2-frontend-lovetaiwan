export function formatCurrency(value: number | undefined | null): string {
  return `S/ ${Number(value ?? 0).toFixed(2)}`;
}

export function formatDate(value: string | undefined | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}

export const TIPO_PAGO_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  YAPE: 'Yape',
  PLIN: 'Plin',
  TARJETA_DEBITO: 'Tarjeta de debito',
  TARJETA_CREDITO: 'Tarjeta de credito',
  TRANSFERENCIA: 'Transferencia'
};

export const ESTADO_COMPRA_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  COMPLETADA: 'Completada'
};

export const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  USER: 'Usuario'
};
