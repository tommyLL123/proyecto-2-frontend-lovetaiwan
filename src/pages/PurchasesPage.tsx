import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, Eye, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { DataTable, type Column } from '../components/data/DataTable';
import { Pagination } from '../components/data/Pagination';
import { SearchToolbar } from '../components/data/SearchToolbar';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { productService, purchaseService } from '../services/resourceService';
import type { Compra, Producto } from '../types/api';
import { getFriendlyError } from '../utils/errors';
import { ESTADO_COMPRA_LABELS, formatCurrency, formatDate } from '../utils/format';
import { filterBySearch, paginate } from '../utils/pagination';

interface CartLine {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export default function PurchasesPage() {
  const { isAdmin } = useAuth();
  const { page, size, search, setPage, setSize, setSearch } = usePagination(10);
  const debouncedSearch = useDebounce(search);
  const { notify } = useToast();

  const [purchases, setPurchases] = useState<Compra[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [productoToAdd, setProductoToAdd] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<Compra | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    Promise.all([isAdmin ? purchaseService.list(signal) : purchaseService.mine(signal), productService.list(signal)])
      .then(([purchasesData, productsData]) => {
        setPurchases(purchasesData);
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

  const filtered = useMemo(() => filterBySearch(purchases, debouncedSearch, (item) => [String(item.id), item.estado]), [purchases, debouncedSearch]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)), [filtered]);
  const { content: items, totalElements, totalPages } = useMemo(() => paginate(sorted, page, size), [sorted, page, size]);

  const cartTotal = cart.reduce((sum, line) => sum + line.precioUnitario * line.cantidad, 0);

  function addToCart() {
    const id = Number(productoToAdd);
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setCart((current) => {
      const existing = current.find((line) => line.productoId === id);
      if (existing) return current.map((line) => (line.productoId === id ? { ...line, cantidad: line.cantidad + 1 } : line));
      return [...current, { productoId: id, nombre: product.nombre, cantidad: 1, precioUnitario: product.costoUnitario }];
    });
    setProductoToAdd('');
  }

  function updateLine(productoId: number, field: 'cantidad' | 'precioUnitario', value: number) {
    setCart((current) => current.map((line) => (line.productoId === productoId ? { ...line, [field]: Math.max(0, value) } : line)));
  }

  function removeFromCart(productoId: number) {
    setCart((current) => current.filter((line) => line.productoId !== productoId));
  }

  function resetForm() {
    setCart([]);
    setProductoToAdd('');
    setShowForm(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (cart.length === 0) {
      notify('Agrega al menos un producto a la compra.', 'error');
      return;
    }
    setSaving(true);
    try {
      await purchaseService.create({
        detalles: cart.map((line) => ({ productoId: line.productoId, cantidad: line.cantidad, precioUnitario: line.precioUnitario }))
      });
      notify('Compra registrada correctamente.', 'success');
      resetForm();
      load();
    } catch (err) {
      notify(getFriendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function markCompleted(id: number) {
    setSaving(true);
    try {
      await purchaseService.updateEstado(id, 'COMPLETADA');
      notify('Compra marcada como completada.', 'success');
      load();
    } catch (err) {
      notify(getFriendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<Column<Compra>[]>(() => {
    const base: Column<Compra>[] = [
      { header: 'ID', render: (item) => <span className="cell-mono">#{item.id}</span> },
      { header: 'Total', render: (item) => formatCurrency(item.total) },
      { header: 'Fecha', render: (item) => formatDate(item.fecha) },
      {
        header: 'Estado',
        render: (item) => <Badge tone={item.estado === 'COMPLETADA' ? 'success' : 'warning'}>{ESTADO_COMPRA_LABELS[item.estado] ?? item.estado}</Badge>
      },
      {
        header: 'Acciones',
        render: (item) => (
          <div className="row-actions">
            <button className="icon-button" onClick={() => setViewing(item)} aria-label="Ver detalle">
              <Eye size={16} />
            </button>
            {isAdmin && item.estado === 'PENDIENTE' && (
              <button className="icon-button" onClick={() => markCompleted(item.id)} aria-label="Marcar como completada">
                <CheckCircle2 size={16} />
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
        title="Compras"
        description={isAdmin ? 'Ordenes de compra a proveedores de todo el negocio.' : 'Tu historial de compras.'}
        actions={
          <button className="button button-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Registrar compra
          </button>
        }
      />
      <div className="panel wide">
        <SearchToolbar value={search} onChange={setSearch} placeholder="Buscar por numero o estado" />
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No hay compras registradas."
            action={
              <button className="button button-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Registrar la primera compra
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
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>
                <ShoppingCart size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Nueva compra
              </h2>
              <button className="icon-button" onClick={() => resetForm()} aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
              <fieldset>
                <legend>Productos a reabastecer</legend>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={productoToAdd} onChange={(e) => setProductoToAdd(e.target.value)} style={{ flex: 1 }}>
                    <option value="">Selecciona un producto</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.nombre}
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
                          aria-label="Cantidad"
                          value={line.cantidad}
                          onChange={(e) => updateLine(line.productoId, 'cantidad', Number(e.target.value))}
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          aria-label="Costo unitario"
                          value={line.precioUnitario}
                          onChange={(e) => updateLine(line.productoId, 'precioUnitario', Number(e.target.value))}
                          style={{ width: 80 }}
                        />
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
                  {saving ? 'Registrando' : 'Confirmar compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div className="modal-backdrop" role="presentation" onClick={() => setViewing(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Compra #{viewing.id}</h2>
            <div className="kv-list" style={{ marginTop: 10 }}>
              <div className="kv-row">
                <span>Estado</span>
                <strong>
                  <Badge tone={viewing.estado === 'COMPLETADA' ? 'success' : 'warning'}>{ESTADO_COMPRA_LABELS[viewing.estado] ?? viewing.estado}</Badge>
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
    </section>
  );
}
