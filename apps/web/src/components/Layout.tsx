import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/speakers', label: 'Speakers' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/timeline', label: 'Day Flow' },
  { to: '/venues', label: 'Venues' },
  { to: '/faq', label: 'FAQ' },
  { to: '/announcements', label: 'Announcements' },
];

export function Layout() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-row">
          <NavLink to="/" className="brand" onClick={closeMenu}>
            <span className="brand-mark">SCD</span>
            <span className="brand-name">AWS Student Community Day</span>
          </NavLink>

          <button
            type="button"
            className="menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={menuOpen ? 'site-nav site-nav-open' : 'site-nav'}>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
                onClick={closeMenu}
              >
                {link.label}
              </NavLink>
            ))}

            <div className="nav-auth">
              {status === 'signed-in' ? (
                <>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
                    onClick={closeMenu}
                  >
                    {user?.email ? 'My Dashboard' : 'Dashboard'}
                  </NavLink>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      logout();
                      closeMenu();
                      navigate('/');
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="nav-link" onClick={closeMenu}>
                    Log in
                  </NavLink>
                  <NavLink to="/register" className="btn btn-primary btn-small" onClick={closeMenu}>
                    Register
                  </NavLink>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>AWS Student Community Day 2026 — Ganpat University</p>
        <p className="site-footer-muted">
          Attendee verification at checkpoints is done by name/registration-number lookup — no QR codes or NFC.
        </p>
      </footer>
    </div>
  );
}
