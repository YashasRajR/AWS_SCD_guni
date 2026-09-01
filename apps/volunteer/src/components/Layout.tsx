import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-title">
          <span className="topbar-mark">SCD</span>
          <span>Volunteer</span>
        </div>
        <div className="topbar-user">
          {user?.email && <span className="topbar-email">{user.email}</span>}
          <button
            type="button"
            className="btn-icon"
            aria-label="Log out"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            ⏻
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'bottom-nav-link active' : 'bottom-nav-link')}>
          <span className="bottom-nav-icon">✓</span>
          <span>Checkpoints</span>
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => (isActive ? 'bottom-nav-link active' : 'bottom-nav-link')}
        >
          <span className="bottom-nav-icon">🕘</span>
          <span>History</span>
        </NavLink>
      </nav>
    </div>
  );
}
