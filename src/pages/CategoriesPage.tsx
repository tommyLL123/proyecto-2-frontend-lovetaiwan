import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '../components/data/DataTable';
import { Pagination } from '../components/data/Pagination';
import { SearchToolbar } from '../components/data/SearchToolbar';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FormField } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { useForm } from '../hooks/useForm';
import { usePagination } from '../hooks/usePagination';
import { categoryService } from '../services/resourceService';
import type { Categoria } from '../types/api';
import { getFriendlyError } from '../utils/errors';
import { filterBySearch, paginate } from '../utils/pagination';

interface CategoryFormValues {
  nombre: string;
  descripcion: string;
}

const emptyForm: CategoryFormValues = { nombre: '', descripcion: '' };

export default function CategoriesPage() {
  const { isAdmin } = useAuth();
  const { page, size, search, setPage, setSize, setSearch } = usePagination(10);
  const debouncedSearch = useDebounce(search);
  const { notify } = useToast();

  const [allItems, setAllItems] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const validate = useCallback((values: CategoryFormValues) => {
    const errors: Partial<Record<keyof CategoryFormValues, string>> = {};
    if (values.nombre.trim().length < 2) errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    return errors;
  }, []);
  const form = useForm<CategoryFormValues>(emptyForm, validate);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    categoryService
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

  const filtered = useMemo(
    () => filterBySearch(allItems, debouncedSearch, (item) => [item.nombre, item.descripcion]),
    [allItems, debouncedSearch]
  );
  const { content: items, totalElements, totalPages } = useMemo(() => paginate(filtered, page, size), [filtered, page, size]);

  function startCreate() {
    setEditing(null);
    form.reset(emptyForm);
  }

  function startEdit(category: Categoria) {
    setEditing(category);
    form.reset({ nombre: category.nombre, descripcion: category.descripcion ?? '' });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.isValid) return;
    setSaving(true);
    const payload = { nombre: form.values.nombre, descripcion: form.values.descripcion || undefined };
    try {
      if (editing) await categoryService.update(editing.id, payload);
      else await categoryService.create(payload);
      notify(editing ? 'Categoria actualizada.' : 'Categoria creada.', 'success');
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
      await categoryService.remove(deleteId);
      notify('Categoria eliminada.', 'success');
      setDeleteId(null);
      if (editing?.id === deleteId) startCreate();
      load();
    } catch (err) {
      notify(getFriendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<Column<Categoria>[]>(() => {
    const base: Column<Categoria>[] = [
      { header: 'Nombre', render: (item) => item.nombre },
      { header: 'Descripcion', render: (item) => item.descripcion || 'Sin descripcion' }
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
        title="Categorias"
        description="Organiza tus productos por categoria."
        actions={
          isAdmin && (
            <button className="button button-secondary" onClick={startCreate}>
              <Plus size={16} /> Nueva
            </button>
          )
        }
      />
      <div className={isAdmin ? 'content-grid' : ''}>
        <div className="panel wide">
          <SearchToolbar value={search} onChange={setSearch} placeholder="Buscar por nombre o descripcion" />
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={() => load()} />
          ) : items.length === 0 ? (
            <EmptyState title="No hay categorias para mostrar." />
          ) : (
            <DataTable columns={columns} data={items} getRowKey={(item) => item.id} />
          )}
          <Pagination page={page} size={size} total={totalElements} totalPages={totalPages} onPage={setPage} onSize={setSize} />
        </div>
        {isAdmin && (
          <form className="panel form-panel" onSubmit={submit}>
            <h2>{editing ? 'Editar categoria' : 'Nueva categoria'}</h2>
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
        title="Eliminar categoria"
        message="Esta accion no se puede deshacer."
        loading={saving}
        onCancel={() => setDeleteId(null)}
        onConfirm={remove}
      />
    </section>
  );
}
