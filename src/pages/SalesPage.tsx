import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Eye, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { DataTable, type Column } from '../components/data/DataTable';
import { Pagination } from '../components/data/Pagination';
import { SearchToolbar } from '../components/data/SearchToolbar';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { FormField } from '../components/ui/FormField';
import { FormSelect } from '../components/ui/FormSelect';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { productService, saleService } from '../services/resourceService';
import type { Producto, TipoDePago, Venta } from '../types/api';
import { getFriendlyError } from '../utils/errors';
import { formatCurrency, formatDate, TIPO_PAGO_LABELS } from '../utils/format';
import { filterBySearch, paginate } from '../utils/pagination';

interface CartLine {
  productoId: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

const TIPOS_PAGO: TipoDePago[] = ['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA'];

export default function SalesPage() {
  const { isAdmin } = useAuth();
  const { page, size, search, setPage, setSize, setSearch } = usePagination(10);
  const debouncedSearch = useDebounce(search);
  const { notify } = useToast();

  const [sales, setSales] = useState<Venta[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [tipoPago, setTipoPago] = useState<TipoDePago>('EFECTIVO');
  const [productoToAdd, setProductoToAdd] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<Venta | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    Promise.all([isAdmin ? saleService.list(signal) : saleService.mine(signal), productService.list(signal)])
      .then(([salesData, productsData]) => {
        setSales(salesData);
        setProducts(productsData);
      })
      .catch((err) => setError(getFriendlyError(err)))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const filtered = useMemo(
    () => filterBySearch(sales, debouncedSearch, (sale) => [sale.clienteNombre, String(sale.id)]),
    [sales, debouncedSearch]
  );
  const sorted = useMemo(() => [...filtered].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)), [filtered]);
  const { content: items, totalElements, totalPages } = useMemo(() => paginate(sorted, page, size), [sorted, page, size]);

  const cartTotal = cart.reduce((sum, line) => sum + line.precioUnitario * line.cantidad, 0);

  function addToCart() {
    const id = Number(productoToAdd);
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setCart((current) => {
      const existing = current.find((line) => line.productoId === id);
      if (existing) {
        return current.map((line) => (line.productoId === id ? { ...line, cantidad: line.cantidad + 1 } : line));
      }
      return [...current, { productoId: id, nombre: product.nombre, precioUnitario: product.precio, cantidad: 1 }];
    });
    setProductoToAdd('');
  }

  function updateQuantity(productoId: number, cantidad: number) {
    setCart((current) =>
      current.map((line) => (line.productoId === productoId ? { ...line, cantidad: Math.max(1, cantidad) } : line))
    );
  }

  function removeFromCart(productoId: number) {
    setCart((current) => current.filter((line) => line.productoId !== productoId));
  }

  function resetForm() {
    setCart([]);
    setClienteNombre('');
    setTipoPago('EFECTIVO');
    setProductoToAdd('');
    setShowForm(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (cart.length === 0) {
      notify('Agrega al menos un producto a la venta.', 'error');
      return;
    }
    setSaving(true);
    try {
      await saleService.create({
        clienteNombre: clienteNombre || undefined,
        tipo: tipoPago,
        detalles: cart.map((line) => ({ productoId: line.productoId, cantidad: line.cantidad }))
      });
      notify('Venta registrada correctamente.', 'success');
      resetForm();
      load();
    } catch (err) {
      notify(getFriendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteId) return;
    setSaving(true);
    try {
      await saleService.remove(deleteId);
      notify('Venta eliminada.', 'success');
      setDeleteId(null);
      load();
    } catch (err) {
      notify(getFriendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<Column<Venta>[]>(() => {
    const base: Column<Venta>[] = [
      { header: 'ID', render: (item) => <span className="cell-mono">#{item.id}</span> },
      { header: 'Cliente', render: (item) => item.clienteNombre || 'Sin especificar' },
      { header: 'Tipo de pago', render: (item) => TIPO_PAGO_LABELS[item.tipo] ?? item.tipo },
      { header: 'Total', render: (item) => formatCurrency(item.total) },
      { header: 'Fecha', render: (item) => formatDate(item.fecha) },
      {
        header: 'Acciones',
        render: (item) => (
          <div className="row-actions">
            <button className="icon-button" onClick={() => setViewing(item)} aria-label="Ver detalle">
              <Eye size={16} />
            </button>
            {isAdmin && (
              <button className="icon-button danger" onClick={() => setDeleteId(item.id)} aria-label="Eliminar">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )
      }
    ];
    return base;
  }, [isAdmin]);

  const availableProducts = products.filter((product) => !cart.some((line) => line.productoId === product.id));

  return (
    <section className="page">
      <PageHeader
        title="Ventas"
        description={isAdmin ? 'Historial de ventas de todo el negocio.' : 'Tu historial de ventas.'}
        actions={
          <button className="button button-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Registrar venta
          </button>
        }
      />
      <div className="panel wide">
        <SearchToolbar value={search} onChange={setSearch} placeholder="Buscar por cliente o numero de venta" />
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No hay ventas registradas."
            action={
              <button className="button button-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Registrar la primera venta
              </button>
            }
          />
        ) : (
          <DataTable columns={columns} data={items} getRowKey={(item) => item.id} />
        )}
        <Pagination page={page} size={size} total={totalElements} totalPages={totalPages} onPage={setPage} onSize={setSize} />
      </div>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onClick={() => resetForm()}>
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>
                <ShoppingBag size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Nueva venta
              </h2>
              <button className="icon-button" onClick={() => resetForm()} aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
              <div className="field-row">
                <FormField label="Cliente (opcional)" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} />
                <FormSelect label="Tipo de pago" value={tipoPago} onChange={(e) => setTipoPago(e.target.value as TipoDePago)}>
                  {TIPOS_PAGO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {TIPO_PAGO_LABELS[tipo]}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <fieldset>
                <legend>Productos</legend>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={productoToAdd} onChange={(e) => setProductoToAdd(e.target.value)} style={{ flex: 1 }}>
                    <option value="">Selecciona un producto</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.nombre} — {formatCurrency(product.precio)}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="button button-secondary" onClick={addToCart} disabled={!productoToAdd}>
                    Agregar
                  </button>
                </div>

                {cart.length === 0 ? (
                  <p className="muted" style={{ marginTop: 10 }}>
                    Aun no agregaste productos.
                  </p>
                ) : (
                  <div className="cart-list" style={{ marginTop: 10 }}>
                    {cart.map((line) => (
                      <div className="cart-row" key={line.productoId}>
                        <span className="cart-row-name">{line.nombre}</span>
                        <input
                          type="number"
                          min={1}
                          value={line.cantidad}
                          onChange={(e) => updateQuantity(line.productoId, Number(e.target.value))}
                        />
                        <span className="cell-mono">{formatCurrency(line.precioUnitario * line.cantidad)}</span>
                        <button type="button" className="icon-button danger" onClick={() => removeFromCart(line.productoId)} aria-label="Quitar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="cart-total">
                      <span>Total</span>
                      <strong>{formatCurrency(cartTotal)}</strong>
                    </div>
                  </div>
                )}
              </fieldset>

              <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={() => resetForm()} disabled={saving}>
                  Cancelar
                </button>
                <button className="button button-primary" disabled={saving || cart.length === 0}>
                  {saving ? 'Registrando' : 'Confirmar venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div className="modal-backdrop" role="presentation" onClick={() => setViewing(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Venta #{viewing.id}</h2>
            <div className="kv-list" style={{ marginTop: 10 }}>
              <div className="kv-row">
                <span>Cliente</span>
                <strong>{viewing.clienteNombre || 'Sin especificar'}</strong>
              </div>
              <div className="kv-row">
                <span>Tipo de pago</span>
                <strong>
                  <Badge tone="neutral">{TIPO_PAGO_LABELS[viewing.tipo] ?? viewing.tipo}</Badge>
                </strong>
              </div>
              <div className="kv-row">
                <span>Fecha</span>
                <strong>{formatDate(viewing.fecha)}</strong>
              </div>
            </div>
            <div className="section-divider" />
            <div className="cart-list">
              {viewing.detalles.map((detalle) => (
                <div className="cart-row" key={detalle.id}>
                  <span className="cart-row-name">
                    {detalle.productoNombre} × {detalle.cantidad}
                  </span>
                  <span className="cell-mono">{formatCurrency(detalle.subtotal)}</span>
                </div>
              ))}
              <div className="cart-total">
                <span>Total</span>
                <strong>{formatCurrency(viewing.total)}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button className="button button-secondary" onClick={() => setViewing(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Eliminar venta"
        message="Esta accion no se puede deshacer."
        loading={saving}
        onCancel={() => setDeleteId(null)}
        onConfirm={remove}
      />
    </section>
  );
}
