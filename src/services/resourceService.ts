import type {
  Categoria,
  CategoriaRequest,
  Compra,
  CompraRequest,
  EstadoCompra,
  Inventario,
  InventarioRequest,
  Producto,
  ProductoRequest,
  Usuario,
  UsuarioRequest,
  Venta,
  VentaRequest
} from '../types/api';
import { requestWithRetry } from './apiClient';

// El backend (ver controllers) NO implementa paginacion: cada GET de lista
// devuelve un array completo (List<...ResponseDTO>), sin page/size/sort.
// Por eso aqui pedimos todo y la paginacion (Pagination.tsx + usePagination)
// se aplica del lado del cliente sobre ese array, igual que con la busqueda.

// ---------- Categorias ----------
export const categoryService = {
  list: (signal?: AbortSignal) => requestWithRetry<Categoria[]>({ url: '/categorias', method: 'GET', signal }),
  get: (id: number, signal?: AbortSignal) => requestWithRetry<Categoria>({ url: `/categorias/${id}`, method: 'GET', signal }),
  create: (data: CategoriaRequest, signal?: AbortSignal) => requestWithRetry<Categoria>({ url: '/categorias', method: 'POST', data, signal }),
  update: (id: number, data: CategoriaRequest, signal?: AbortSignal) => requestWithRetry<Categoria>({ url: `/categorias/${id}`, method: 'PUT', data, signal }),
  remove: (id: number, signal?: AbortSignal) => requestWithRetry<void>({ url: `/categorias/${id}`, method: 'DELETE', signal })
};

// ---------- Productos ----------
export const productService = {
  list: (signal?: AbortSignal) => requestWithRetry<Producto[]>({ url: '/productos', method: 'GET', signal }),
  get: (id: number, signal?: AbortSignal) => requestWithRetry<Producto>({ url: `/productos/${id}`, method: 'GET', signal }),
  byCategoria: (categoriaId: number, signal?: AbortSignal) => requestWithRetry<Producto[]>({ url: `/productos/categoria/${categoriaId}`, method: 'GET', signal }),
  create: (data: ProductoRequest, signal?: AbortSignal) => requestWithRetry<Producto>({ url: '/productos', method: 'POST', data, signal }),
  update: (id: number, data: ProductoRequest, signal?: AbortSignal) => requestWithRetry<Producto>({ url: `/productos/${id}`, method: 'PUT', data, signal }),
  remove: (id: number, signal?: AbortSignal) => requestWithRetry<void>({ url: `/productos/${id}`, method: 'DELETE', signal })
};

// ---------- Inventario ----------
export const inventoryService = {
  list: (signal?: AbortSignal) => requestWithRetry<Inventario[]>({ url: '/inventario', method: 'GET', signal }),
  byProducto: (productoId: number, signal?: AbortSignal) => requestWithRetry<Inventario>({ url: `/inventario/producto/${productoId}`, method: 'GET', signal }),
  bajoStock: (signal?: AbortSignal) => requestWithRetry<Inventario[]>({ url: '/inventario/bajo-stock', method: 'GET', signal }),
  update: (id: number, data: InventarioRequest, signal?: AbortSignal) => requestWithRetry<Inventario>({ url: `/inventario/${id}`, method: 'PATCH', data, signal })
};

// ---------- Ventas ----------
export const saleService = {
  list: (signal?: AbortSignal) => requestWithRetry<Venta[]>({ url: '/ventas', method: 'GET', signal }),
  mine: (signal?: AbortSignal) => requestWithRetry<Venta[]>({ url: '/ventas/mias', method: 'GET', signal }),
  byUsuario: (usuarioId: number, signal?: AbortSignal) => requestWithRetry<Venta[]>({ url: `/ventas/usuario/${usuarioId}`, method: 'GET', signal }),
  get: (id: number, signal?: AbortSignal) => requestWithRetry<Venta>({ url: `/ventas/${id}`, method: 'GET', signal }),
  create: (data: VentaRequest, signal?: AbortSignal) => requestWithRetry<Venta>({ url: '/ventas', method: 'POST', data, signal }),
  remove: (id: number, signal?: AbortSignal) => requestWithRetry<void>({ url: `/ventas/${id}`, method: 'DELETE', signal })
};

// ---------- Compras ----------
export const purchaseService = {
  list: (signal?: AbortSignal) => requestWithRetry<Compra[]>({ url: '/compras', method: 'GET', signal }),
  mine: (signal?: AbortSignal) => requestWithRetry<Compra[]>({ url: '/compras/mias', method: 'GET', signal }),
  byUsuario: (usuarioId: number, signal?: AbortSignal) => requestWithRetry<Compra[]>({ url: `/compras/usuario/${usuarioId}`, method: 'GET', signal }),
  get: (id: number, signal?: AbortSignal) => requestWithRetry<Compra>({ url: `/compras/${id}`, method: 'GET', signal }),
  create: (data: CompraRequest, signal?: AbortSignal) => requestWithRetry<Compra>({ url: '/compras', method: 'POST', data, signal }),
  updateEstado: (id: number, estado: EstadoCompra, signal?: AbortSignal) =>
    requestWithRetry<Compra>({ url: `/compras/${id}/estado`, method: 'PATCH', params: { estado }, signal })
};

// ---------- Usuarios ----------
export const userService = {
  list: (signal?: AbortSignal) => requestWithRetry<Usuario[]>({ url: '/usuarios', method: 'GET', signal }),
  get: (id: number, signal?: AbortSignal) => requestWithRetry<Usuario>({ url: `/usuarios/${id}`, method: 'GET', signal }),
  updateProfile: (id: number, data: UsuarioRequest, signal?: AbortSignal) => requestWithRetry<Usuario>({ url: `/usuarios/${id}`, method: 'PUT', data, signal }),
  remove: (id: number, signal?: AbortSignal) => requestWithRetry<void>({ url: `/usuarios/${id}`, method: 'DELETE', signal })
};
