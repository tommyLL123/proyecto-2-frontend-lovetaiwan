import { LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROL_LABELS } from '../../utils/format';
import { Breadcrumbs } from './Breadcrumbs';

export function Topbar() {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <Breadcrumbs />
      <div className="user-menu">
        <UserRound size={18} />
        <span>{user?.email}</span>
        {user?.rol && <span className="role-pill">{ROL_LABELS[user.rol] ?? user.rol}</span>}
        <button className="icon-button" aria-label="Cerrar sesion" onClick={logout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
