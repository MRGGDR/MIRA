import { NavLink, Outlet } from 'react-router-dom';
import { navigationItems } from '@/config/navigation';
import { NavigationProgressBar } from '@/components/feedback/NavigationProgressBar';
import { useAuth } from '@/features/auth/AuthContext';

export function MainLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <NavigationProgressBar />
      <aside className="sidebar">
        <span className="sidebar__glow-stripe" aria-hidden />
        <div className="brand">
          <img src="/Logo-ungrd-blanco.png" alt="UNGRD" className="brand__img" />
          <h1 className="brand__title">Acciones correctivas y de mejora</h1>
        </div>
        <p className="nav-section-label">Modulos</p>
        <nav aria-label="Navegacion principal">
          <ul className="nav-list">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink className="nav-link" to={item.path} end={item.path === '/'}>
                    <Icon aria-hidden size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="sidebar__footer">
          <div className="sidebar__session">
            <span className="sidebar__user-card">
              {user?.nombre ?? 'Sesion activa'} - {user?.rol}
              {user?.proceso && !user.permissions.canAdmin ? ` - ${user.proceso}` : ''}
            </span>
            <button className="sidebar__logout" type="button" onClick={logout}>
              Cerrar sesion
            </button>
          </div>
          <div className="sidebar__office">
            <span className="sidebar__footer-badge">Oficina Asesora de Planeacion e Informacion</span>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
