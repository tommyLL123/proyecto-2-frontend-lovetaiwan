import { Link, useLocation } from 'react-router-dom';

const labels: Record<string, string> = {
  productos: 'Productos',
  categorias: 'Categorias',
  inventario: 'Inventario',
  ventas: 'Ventas',
  compras: 'Compras',
  perfil: 'Perfil',
  usuarios: 'Usuarios'
};

function isNumeric(value: string) {
  return /^\d+$/.test(value);
}

export function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  return (
    <div className="breadcrumbs" aria-label="Ruta actual">
      <Link to="/">Inicio</Link>
      {parts.map((part, index) => {
        const path = `/${parts.slice(0, index + 1).join('/')}`;
        const label = isNumeric(part) ? `#${part}` : labels[part] ?? part;
        return (
          <span key={path}>
            / <Link to={path}>{label}</Link>
          </span>
        );
      })}
    </div>
  );
}
