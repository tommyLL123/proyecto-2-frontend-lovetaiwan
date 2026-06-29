import { Boxes, FolderTree, Package, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { categoryService, inventoryService, productService, saleService } from '../services/resourceService';
import { formatCurrency, formatDate } from '../utils/format';

export default function DashboardPage() {
  const { isAdmin } = useAuth();

  const { data, loading, error, refetch } = useFetch(
    async (signal) => {
      const [products, categories, sales, inventory] = await Promise.all([
        productService.list(signal),
        categoryService.list(signal),
        isAdmin ? saleService.list(signal) : saleService.mine(signal),
        isAdmin ? inventoryService.bajoStock(signal) : Promise.resolve([])
      ]);
      return { products, categories, sales, lowStock: inventory };
    },
    [isAdmin]
  );

  if (loading) return <LoadingState label="Cargando dashboard" />;
  if (error || !data) return <ErrorState message={error} onRetry={refetch} />;

  const salesTotal = data.sales.reduce((sum, sale) => sum + (sale.total ?? 0), 0);
  const recentSales = [...data.sales].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 6);

  return (
    <section className="page">
      <PageHeader
        title="Dashboard"
        description={isAdmin ? 'Resumen operativo de todo el negocio.' : 'Resumen de tu actividad de ventas.'}
      />
      <div className="stats-grid">
        <StatCard label="Productos" value={data.products.length} icon={Package} tone="blue" />
        <StatCard label="Categorias" value={data.categories.length} icon={FolderTree} tone="green" />
        {isAdmin && <StatCard label="Stock bajo" value={data.lowStock.length} icon={Boxes} tone="orange" />}
        <StatCard label={isAdmin ? 'Ventas totales S/' : 'Mis ventas S/'} value={formatCurrency(salesTotal)} icon={ReceiptText} tone="red" />
      </div>
      <div className="dashboard-grid">
        {isAdmin && (
          <article className="panel">
            <h2>Alertas de inventario</h2>
            {data.lowStock.length === 0 ? (
              <p className="muted">No hay productos con stock bajo.</p>
            ) : (
              data.lowStock.slice(0, 6).map((item) => (
                <p key={item.id}>
                  {item.productoNombre} — {item.cantidadDisponible} unidades (minimo {item.stockMinimo})
                </p>
              ))
            )}
            {data.lowStock.length > 0 && (
              <p>
                <Link to="/inventario">Ver inventario completo</Link>
              </p>
            )}
          </article>
        )}
        <article className="panel">
          <h2>{isAdmin ? 'Ultimas ventas' : 'Mis ultimas ventas'}</h2>
          {recentSales.length === 0 ? (
            <p className="muted">Aun no hay ventas registradas.</p>
          ) : (
            recentSales.map((sale) => (
              <p key={sale.id}>
                Venta #{sale.id} · {formatCurrency(sale.total)} · {formatDate(sale.fecha)}
              </p>
            ))
          )}
          <p>
            <Link to="/ventas">Ver todas las ventas</Link>
          </p>
        </article>
      </div>
    </section>
  );
}
