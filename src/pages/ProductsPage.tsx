import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '../components/data/DataTable';
import { Pagination } from '../components/data/Pagination';
import { SearchToolbar } from '../components/data/SearchToolbar';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FormField } from '../components/ui/FormField';
import { FormSelect } from '../components/ui/FormSelect';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { useForm } from '../hooks/useForm';
import { usePagination } from '../hooks/usePagination';
import { categoryService, productService } from '../services/resourceService';
import type { Categoria, Producto } from '../types/api';
import { getFriendlyError } from '../utils/errors';
import { formatCurrency } from '../utils/format';
import { filterBySearch, paginate } from '../utils/pagination';

interface ProductFormValues {
  nombre: string;
  descripcion: string;
  precio: string;
  costoUnitario: string;
  categoriaId: string;
}

const emptyForm: ProductFormValues = { nombre: '', descripcion: '', precio: '', costoUnitario: '', categoriaId: '' };

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const { page, size, search, setPage, setSize, setSearch } = usePagination(10);
  const debouncedSearch = useDebounce(search);
  const { notify } = useToast();

  const [allItems, setAllItems] = useState<Producto[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Producto | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const validate = useCallback((values: ProductFormValues) => {
    const errors: Partial<Record<keyof ProductFormValues, string>> = {};
    if (values.nombre.trim().length < 2) errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    if (!values.categoriaId) errors.categoriaId = 'Selecciona una categoria.';
    if (!values.precio || Number(values.precio) <= 0) errors.precio = 'El precio debe ser mayor a cero.';
    if (!values.costoUnitario || Number(values.costoUnitario) <= 0) errors.costoUnitario = 'El costo debe ser mayor a cero.';
    return errors;
  }, []);
  const form = useForm<ProductFormValues>(emptyForm, validate);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    Promise.all([productService.list(signal), categoryService.list(signal)])
      .then(([products, cats]) => {
        setAllItems(products);
        setCategories(cats);
      })
      .catch((err) => setError(getFriendlyError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const filtered = useMemo(
    () => filterBySearch(allItems, debouncedSearch, (item) => [item.nombre, item.descripcion, item.categoriaNombre]),
    [allItems, debouncedSearch]
  );
  const { content: items, totalElements, totalPages } = useMemo(() => paginate(filtered, page, size), [filtered, page, size]);

  function startCreate() {
    setEditing(null);
    form.reset(emptyForm);
  }

  function startEdit(product: Producto) {
    setEditing(product);
    form.reset({
      nombre: product.nombre,
      descripcion: product.descripcion ?? '',
      precio: String(product.precio),
      costoUnitario: String(product.costoUnitario),
      categoriaId: String(product.categoriaId)
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.isValid) return;
    setSaving(true);
    const payload = {
      nombre: form.values.nombre,
      descripcion: form.values.descripcion || undefined,
      precio: Number(form.values.precio),
      costoUnitario: Number(form.values.costoUnitario),
      categoriaId: Number(form.values.categoriaId)
    };
    try {
      if (editing) await productService.update(editing.id, payload);
      else await productService.create(payload);
      notify(editing ? 'Producto actualizado.' : 'Producto creado.', 'success');
      startCreate();
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
      await productService.remove(deleteId);
      notify('Producto eliminado.', 'success');
      setDeleteId(null);
      if (editing?.id === deleteId) startCreate();
      load();
    } catch (err) {
      notify(getFriendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<Column<Producto>[]>(() => {
    const base: Column<Producto>[] = [
      { header: 'Nombre', render: (item) => <Link to={`/productos/${item.id}`}>{item.nombre}</Link> },
      { header: 'Categoria', render: (item) => item.categoriaNombre },
      { header: 'Precio', render: (item) => formatCurrency(item.precio) },
      { header: 'Costo', render: (item) => formatCurrency(item.costoUnitario) }
    ];
    if (isAdmin) {
      base.push({
        header: 'Acciones',
        render: (item) => (
          <div className="row-actions">
            <button className="icon-button" onClick={() => startEdit(item)} aria-label="Editar">
              <Edit size={16} />
            </button>
            <button className="icon-button danger" onClick={() => setDeleteId(item.id)} aria-label="Eliminar">
              <Trash2 size={16} />
            </button>
          </div>
        )
      });
    }
    return base;
  }, [isAdmin]);

  return (
    <section className="page">
      <PageHeader
        title="Productos"
        description="Catalogo de productos conectado al backend de Sellio."
        actions={
          isAdmin && (
            <button className="button button-secondary" onClick={startCreate}>
              <Plus size={16} /> Nuevo
            </button>
          )
        }
      />
      <div className={isAdmin ? 'content-grid' : ''}>
        <div className="panel wide">
          <SearchToolbar value={search} onChange={setSearch} placeholder="Buscar por nombre, descripcion o categoria" />
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={() => load()} />
          ) : items.length === 0 ? (
            <EmptyState title="No hay productos para mostrar." />
          ) : (
            <DataTable columns={columns} data={items} getRowKey={(item) => item.id} />
          )}
          <Pagination page={page} size={size} total={totalElements} totalPages={totalPages} onPage={setPage} onSize={setSize} />
        </div>
        {isAdmin && (
          <form className="panel form-panel" onSubmit={submit}>
            <h2>{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
            <FormField
              label="Nombre"
              value={form.values.nombre}
              onChange={(e) => form.setField('nombre', e.target.value)}
              error={form.touched.nombre ? form.errors.nombre : undefined}
            />
            <FormField
              label="Descripcion"
              value={form.values.descripcion}
              onChange={(e) => form.setField('descripcion', e.target.value)}
            />
            <FormSelect
              label="Categoria"
              value={form.values.categoriaId}
              onChange={(e) => form.setField('categoriaId', e.target.value)}
              error={form.touched.categoriaId ? form.errors.categoriaId : undefined}
            >
              <option value="">Selecciona una categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </FormSelect>
            <div className="field-row">
              <FormField
                label="Precio (S/)"
                type="number"
                min="0"
                step="0.01"
                value={form.values.precio}
                onChange={(e) => form.setField('precio', e.target.value)}
                error={form.touched.precio ? form.errors.precio : undefined}
              />
              <FormField
                label="Costo unitario (S/)"
                type="number"
                min="0"
                step="0.01"
                value={form.values.costoUnitario}
                onChange={(e) => form.setField('costoUnitario', e.target.value)}
                error={form.touched.costoUnitario ? form.errors.costoUnitario : undefined}
              />
            </div>
            <button className="button button-primary" disabled={saving || !form.isValid}>
              {saving ? 'Guardando' : 'Guardar'}
            </button>
            {editing && (
              <button type="button" className="button button-ghost" onClick={startCreate}>
                Cancelar edicion
              </button>
            )}
          </form>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Eliminar producto"
        message="Esta accion no se puede deshacer."
        loading={saving}
        onCancel={() => setDeleteId(null)}
        onConfirm={remove}
      />
    </section>
  );
}
