import { NavLink } from 'react-router-dom';
import { BarChart3, Boxes, FolderTree, Package, ReceiptText, ShoppingCart, UserRound, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const baseItems = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/categorias', label: 'Categorias', icon: FolderTree },
  { to: '/ventas', label: 'Ventas', icon: ReceiptText },
  { to: '/compras', label: 'Compras', icon: ShoppingCart }
];

const adminItems = [
  { to: '/inventario', label: 'Inventario', icon: Boxes },
  { to: '/usuarios', label: 'Usuarios', icon: Users }
];

export function Sidebar() {
  const { isAdmin } = useAuth();
  const items = isAdmin ? [...baseItems, ...adminItems] : baseItems;

  return (
    <aside className="sidebar">
      <div className="brand">
        <span>S</span>
        <strong>Sellio</strong>
      </div>
      <nav>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')} end={to === '/'}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
        <NavLink to="/perfil" className={({ isActive }) => (isActive ? 'active' : '')}>
          <UserRound size={18} /> Perfil
        </NavLink>
      </nav>
      <div className="sidebar-footer">CS2031 · DBP 2026-1</div>
    </aside>
  );
}
