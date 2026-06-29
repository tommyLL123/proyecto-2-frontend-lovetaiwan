import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DataTable, type Column } from '../components/data/DataTable';
import { Pagination } from '../components/data/Pagination';
import { SearchToolbar } from '../components/data/SearchToolbar';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { userService } from '../services/resourceService';
import type { Usuario } from '../types/api';
import { getFriendlyError } from '../utils/errors';
import { ROL_LABELS } from '../utils/format';
import { filterBySearch, paginate } from '../utils/pagination';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { page, size, search, setPage, setSize, setSearch } = usePagination(10);
  const debouncedSearch = useDebounce(search);
  const { notify } = useToast();

  const [allItems, setAllItems] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    userService
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
    () => filterBySearch(allItems, debouncedSearch, (item) => [item.nombre, item.email]),
    [allItems, debouncedSearch]
  );
  const { content: items, totalElements, totalPages } = useMemo(() => paginate(filtered, page, size), [filtered, page, size]);

  async function remove() {
    if (!deleteId) return;
    setSaving(true);
    try {
      await userService.remove(deleteId);
      notify('Usuario eliminado.', 'success');
      setDeleteId(null);
      load();
    } catch (err) {
      notify(getFriendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<Column<Usuario>[]>(
    () => [
      { header: 'Nombre', render: (item) => item.nombre },
      { header: 'Correo', render: (item) => item.email },
      { header: 'Telefono', render: (item) => item.telefono || 'Sin registrar' },
      { header: 'Rol', render: (item) => <Badge tone={item.rol === 'ADMIN' ? 'warning' : 'neutral'}>{ROL_LABELS[item.rol] ?? item.rol}</Badge> },
      {
        header: 'Acciones',
        render: (item) => (
          <button
            className="icon-button danger"
            onClick={() => setDeleteId(item.id)}
            disabled={item.id === currentUser?.userId}
            aria-label="Eliminar"
            title={item.id === currentUser?.userId ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'}
          >
            <Trash2 size={16} />
          </button>
        )
      }
    ],
    [currentUser]
  );

  return (
    <section className="page">
      <PageHeader title="Usuarios" description="Cuentas registradas en Sellio." />
      <div className="panel wide">
        <SearchToolbar value={search} onChange={setSearch} placeholder="Buscar por nombre o correo" />
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load()} />
        ) : items.length === 0 ? (
          <EmptyState title="No hay usuarios para mostrar." />
        ) : (
          <DataTable columns={columns} data={items} getRowKey={(item) => item.id} />
        )}
        <Pagination page={page} size={size} total={totalElements} totalPages={totalPages} onPage={setPage} onSize={setSize} />
      </div>
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Eliminar usuario"
        message="Esta accion no se puede deshacer."
        loading={saving}
        onCancel={() => setDeleteId(null)}
        onConfirm={remove}
      />
    </section>
  );
}
