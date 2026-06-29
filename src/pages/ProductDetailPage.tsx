import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Boxes } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { inventoryService, productService } from '../services/resourceService';
import type { Inventario, Producto } from '../types/api';
import { getFriendlyError } from '../utils/errors';
import { formatCurrency } from '../utils/format';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Producto | null>(null);
  const [inventory, setInventory] = useState<Inventario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    (signal?: AbortSignal) => {
      const productoId = Number(id);
      if (!productoId) return;
      setLoading(true);
      setError('');
      Promise.all([
        productService.get(productoId, signal),
        isAdmin ? inventoryService.byProducto(productoId, signal).catch(() => null) : Promise.resolve(null)
      ])
        .then(([productData, inventoryData]) => {
          setProduct(productData);
          setInventory(inventoryData);
        })
        .catch((err) => setError(getFriendlyError(err)))
        .finally(() => setLoading(false));
    },
    [id, isAdmin]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (loading) return <LoadingState label="Cargando producto" />;
  if (error || !product) return <ErrorState message={error || 'Producto no encontrado.'} onRetry={() => load()} />;

  const margen = product.precio - product.costoUnitario;
  const margenPorcentaje = product.costoUnitario > 0 ? (margen / product.costoUnitario) * 100 : 0;

  return (
    <section className="page">
      <PageHeader
        title={product.nombre}
        description={product.categoriaNombre}
        actions={
          <button className="button button-ghost" onClick={() => navigate('/productos')}>
            <ArrowLeft size={16} /> Volver a productos
          </button>
        }
      />
      <div className="detail-grid">
        <div className="panel">
          <h2>Informacion general</h2>
          <p style={{ marginBottom: 16 }}>{product.descripcion || 'Este producto no tiene descripcion.'}</p>
          <div className="kv-list">
            <div className="kv-row">
              <span>Precio de venta</span>
              <strong>{formatCurrency(product.precio)}</strong>
            </div>
            <div className="kv-row">
              <span>Costo unitario</span>
              <strong>{formatCurrency(product.costoUnitario)}</strong>
            </div>
            <div className="kv-row">
              <span>Margen</span>
              <strong>
                {formatCurrency(margen)} ({margenPorcentaje.toFixed(0)}%)
              </strong>
            </div>
            <div className="kv-row">
              <span>Categoria</span>
              <strong>
                <Link to="/categorias">{product.categoriaNombre}</Link>
              </strong>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="panel">
            <h2>
              <Boxes size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Inventario
            </h2>
            {inventory ? (
              <div className="kv-list">
                <div className="kv-row">
                  <span>Disponible</span>
                  <strong>{inventory.cantidadDisponible} unidades</strong>
                </div>
                <div className="kv-row">
                  <span>Stock minimo</span>
                  <strong>{inventory.stockMinimo} unidades</strong>
                </div>
                <div className="kv-row">
                  <span>Estado</span>
                  <strong>
                    {inventory.cantidadDisponible <= inventory.stockMinimo ? (
                      <Badge tone="danger">Bajo stock</Badge>
                    ) : (
                      <Badge tone="success">OK</Badge>
                    )}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="muted">Este producto aun no tiene un registro de inventario.</p>
            )}
            <p style={{ marginTop: 14 }}>
              <Link to="/inventario">Gestionar inventario</Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
