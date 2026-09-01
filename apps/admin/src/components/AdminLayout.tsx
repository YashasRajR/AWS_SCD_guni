import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';

const NAV_SECTIONS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: 'Overview',
    links: [{ to: '/', label: 'Dashboard' }],
  },
  {
    title: 'Event content',
    links: [
      { to: '/content/event', label: 'Event details' },
      { to: '/content/speakers', label: 'Speakers' },
      { to: '/content/sessions', label: 'Sessions' },
      { to: '/content/venues', label: 'Venues' },
      { to: '/content/agenda', label: 'Agenda' },
      { to: '/content/timeline', label: 'Timeline' },
      { to: '/content/faqs', label: 'FAQs' },
      { to: '/content/announcements', label: 'Announcements' },
    ],
  },
  {
    title: 'Operations',
    links: [
      { to: '/registrations', label: 'Registrations' },
      { to: '/attendees', label: 'Attendees' },
      { to: '/checkpoints', label: 'Checkpoints' },
      { to: '/volunteers', label: 'Volunteers' },
      { to: '/audit-logs', label: 'Audit logs' },
    ],
  },
];

export function AdminLayout() {
  // `identity` (decoded from the stored token) survives a page reload;
  // `user` (the full PublicUser from the login response) is only set right
  // after a fresh login — identity.email is the reliable one to show here.
  const { identity, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">SCD</span>
          <span>Admin</span>
        </div>
        <nav>
          {NAV_SECTIONS.map((section) => (
            <div className="nav-section" key={section.title}>
              <div className="nav-section-title">{section.title}</div>
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <span />
          <div className="topbar-user">
            <span className="topbar-email">{identity?.email ?? 'Admin'}</span>
            <button type="button" className="btn btn-secondary" onClick={logout}>
              Log out
            </button>
          </div>
        </header>
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
