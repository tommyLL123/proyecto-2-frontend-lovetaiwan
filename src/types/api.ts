/**
 * Tipos alineados 1:1 con los DTOs reales del backend Sellio (com.example.proyectodbp.dto).
 * Cualquier cambio aqui debe reflejar un cambio real en el backend.
 */

export type Rol = 'ADMIN' | 'USER';

export type TipoDePago =
  | 'EFECTIVO'
  | 'YAPE'
  | 'PLIN'
  | 'TARJETA_DEBITO'
  | 'TARJETA_CREDITO'
  | 'TRANSFERENCIA';

export type EstadoCompra = 'PENDIENTE' | 'COMPLETADA';

// ---------- Usuario ----------
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  rol: Rol;
}

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: string;
  rol?: Rol;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

// ---------- Categoria ----------
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface CategoriaRequest {
  nombre: string;
  descripcion?: string;
}

// ---------- Producto ----------
export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costoUnitario: number;
  categoriaId: number;
  categoriaNombre: string;
}

export interface ProductoRequest {
  categoriaId: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costoUnitario: number;
}

// ---------- Inventario ----------
export interface Inventario {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidadDisponible: number;
  stockMinimo: number;
}

export interface InventarioRequest {
  cantidadDisponible: number;
  stockMinimo: number;
}

// ---------- Venta ----------
export interface DetalleDeVenta {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface DetalleDeVentaRequest {
  productoId: number;
  cantidad: number;
}

export interface Venta {
  id: number;
  usuarioId: number;
  clienteNombre?: string;
  tipo: TipoDePago;
  total: number;
  fecha: string;
  detalles: DetalleDeVenta[];
}

export interface VentaRequest {
  clienteNombre?: string;
  tipo: TipoDePago;
  detalles: DetalleDeVentaRequest[];
}

// ---------- Compra ----------
export interface DetalleCompra {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface DetalleCompraRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

export interface Compra {
  id: number;
  usuarioId: number;
  total: number;
  fecha: string;
  estado: EstadoCompra;
  detalles: DetalleCompra[];
}

export interface CompraRequest {
  detalles: DetalleCompraRequest[];
}

// ---------- Errores del backend ----------
// Spring (handler de errores por defecto / @ControllerAdvice tipico) suele devolver
// algo como { timestamp, status, error, message, path } o { message }.
export interface ApiErrorBody {
  message?: string;
  error?: string;
  errors?: Record<string, string> | Array<{ field?: string; defaultMessage?: string }>;
  status?: number;
  path?: string;
}
