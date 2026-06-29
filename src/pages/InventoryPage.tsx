import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Edit } from 'lucide-react';
import { DataTable, type Column } from '../components/data/DataTable';
import { Pagination } from '../components/data/Pagination';
import { SearchToolbar } from '../components/data/SearchToolbar';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { FormField } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { useForm } from '../hooks/useForm';
import { usePagination } from '../hooks/usePagination';
import { inventoryService } from '../services/resourceService';
import type { Inventario } from '../types/api';
import { getFriendlyError } from '../utils/errors';
import { filterBySearch, paginate } from '../utils/pagination';

interface StockFormValues {
  cantidadDisponible: string;
  stockMinimo: string;
}

export default function InventoryPage() {
  const { page, size, search, setPage, setSize, setSearch } = usePagination(10);
  const debouncedSearch = useDebounce(search);
  const { notify } = useToast();

  const [allItems, setAllItems] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Inventario | null>(null);
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const validate = useCallback((values: StockFormValues) => {
    const errors: Partial<Record<keyof StockFormValues, string>> = {};
    if (values.cantidadDisponible === '' || Number(values.cantidadDisponible) < 0) errors.cantidadDisponible = 'Ingresa una cantidad valida.';
    if (values.stockMinimo === '' || Number(values.stockMinimo) < 0) errors.stockMinimo = 'Ingresa un stock minimo valido.';
    return errors;
  }, []);
  const form = useForm<StockFormValues>({ cantidadDisponible: '', stockMinimo: '' }, validate);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    inventoryService
      .list(signal)
      .then(setAllItems)
      .catch((err) => setError(getFriendlyError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const lowStockFiltered = useMemo(
    () => (onlyLowStock ? allItems.filter((item) => item.cantidadDisponible <= item.stockMinimo) : allItems),
    [allItems, onlyLowStock]
  );
  const filtered = useMemo(
    () => filterBySearch(lowStockFiltered, debouncedSearch, (item) => [item.productoNombre]),
    [lowStockFiltered, debouncedSearch]
  );
  const { content: items, totalElements, totalPages } = useMemo(() => paginate(filtered, page, size), [filtered, page, size]);

  function startEdit(item: Inventario) {
    setEditing(item);
    form.reset({ cantidadDisponible: String(item.cantidadDisponible), stockMinimo: String(item.stockMinimo) });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing || !form.isValid) return;
    setSaving(true);
    try {
      await inventoryService.update(editing.id, {
        cantidadDisponible: Number(form.values.cantidadDisponible),
        stockMinimo: Number(form.values.stockMinimo)
      });
      notify('Inventario actualizado.', 'success');
      setEditing(null);
      form.reset({ cantidadDisponible: '', stockMinimo: '' });
      load();
    } catch (err) {
      notify(getFriendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<Column<Inventario>[]>(
    () => [
      { header: 'Producto', render: (item) => item.productoNombre },
      { header: 'Disponible', render: (item) => item.cantidadDisponible },
      { header: 'Stock minimo', render: (item) => item.stockMinimo },
      {
        header: 'Estado',
        render: (item) =>
          item.cantidadDisponible <= item.stockMinimo ? (
            <Badge tone="danger">
              <AlertTriangle size={12} /> Bajo stock
            </Badge>
          ) : (
            <Badge tone="success">OK</Badge>
          )
      },
      {
        header: 'Acciones',
        render: (item) => (
          <button className="icon-button" onClick={() => startEdit(item)} aria-label="Editar stock">
            <Edit size={16} />
          </button>
        )
      }
    ],
    []
  );

  return (
    <section className="page">
      <PageHeader title="Inventario" description="Controla el stock disponible y los minimos por producto." />
      <div className="content-grid">
        <div className="panel wide">
          <SearchToolbar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por producto"
            filters={
              <select value={onlyLowStock ? 'low' : 'all'} onChange={(e) => setOnlyLowStock(e.target.value === 'low')}>
                <option value="all">Todos los productos</option>
                <option value="low">Solo bajo stock</option>
              </select>
            }
          />
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={() => load()} />
          ) : items.length === 0 ? (
            <EmptyState title="No hay registros de inventario para mostrar." />
          ) : (
            <DataTable columns={columns} data={items} getRowKey={(item) => item.id} />
          )}
          <Pagination page={page} size={size} total={totalElements} totalPages={totalPages} onPage={setPage} onSize={setSize} />
        </div>
        <form className="panel form-panel" onSubmit={submit}>
          <h2>{editing ? `Editar stock: ${editing.productoNombre}` : 'Selecciona un producto'}</h2>
          {editing ? (
            <>
              <FormField
                label="Cantidad disponible"
                type="number"
                min="0"
                value={form.values.cantidadDisponible}
                onChange={(e) => form.setField('cantidadDisponible', e.target.value)}
                error={form.touched.cantidadDisponible ? form.errors.cantidadDisponible : undefined}
              />
              <FormField
                label="Stock minimo"
                type="number"
                min="0"
                value={form.values.stockMinimo}
                onChange={(e) => form.setField('stockMinimo', e.target.value)}
                error={form.touched.stockMinimo ? form.errors.stockMinimo : undefined}
              />
              <button className="button button-primary" disabled={saving || !form.isValid}>
                {saving ? 'Guardando' : 'Actualizar stock'}
              </button>
              <button type="button" className="button button-ghost" onClick={() => setEditing(null)}>
                Cancelar
              </button>
            </>
          ) : (
            <p className="muted">Haz clic en el icono de editar de un producto para ajustar su stock.</p>
          )}
        </form>
      </div>
    </section>
  );
}
