import { NavLink, Outlet } from 'react-router-dom';
import { hasPermission } from '@scd/auth';
import { PERMISSIONS } from '@scd/constants';
import { useAuth } from '../lib/auth.js';

const NAV_SECTIONS: {
  title: string;
  links: { to: string; label: string; permission?: string }[];
}[] = [
  {
    title: 'Overview',
    links: [{ to: '/', label: 'Dashboard' }],
  },
  {
    title: 'Event content',
    links: [
      { to: '/content/event', label: 'Event details', permission: PERMISSIONS.MANAGE_SETTINGS },
      { to: '/content/ticket-plans', label: 'Ticket plans', permission: PERMISSIONS.MANAGE_SETTINGS },
      { to: '/content/coupons', label: 'Coupons', permission: PERMISSIONS.MANAGE_SETTINGS },
      { to: '/content/speakers', label: 'Speakers', permission: PERMISSIONS.MANAGE_SPEAKERS },
      { to: '/content/sessions', label: 'Sessions', permission: PERMISSIONS.MANAGE_SESSIONS },
      { to: '/content/venues', label: 'Venues', permission: PERMISSIONS.MANAGE_VENUES },
      { to: '/content/agenda', label: 'Agenda', permission: PERMISSIONS.MANAGE_AGENDA },
      { to: '/content/timeline', label: 'Timeline', permission: PERMISSIONS.MANAGE_TIMELINE },
      { to: '/content/faqs', label: 'FAQs', permission: PERMISSIONS.MANAGE_FAQ },
      {
        to: '/content/announcements',
        label: 'Announcements',
        permission: PERMISSIONS.MANAGE_ANNOUNCEMENTS,
      },
    ],
  },
  {
    title: 'Operations',
    links: [
      {
        to: '/registrations',
        label: 'Registrations',
        permission: PERMISSIONS.MANAGE_REGISTRATIONS,
      },
      { to: '/attendees', label: 'Attendees', permission: PERMISSIONS.VIEW_ATTENDEE },
      { to: '/payments', label: 'Payments', permission: PERMISSIONS.MANAGE_PAYMENTS },
      { to: '/tickets', label: 'Tickets', permission: PERMISSIONS.MANAGE_REGISTRATIONS },
      { to: '/checkpoints', label: 'Checkpoints', permission: PERMISSIONS.MANAGE_CHECKPOINTS },
      { to: '/volunteers', label: 'Volunteers', permission: PERMISSIONS.MANAGE_VOLUNTEERS },
      { to: '/certificates', label: 'Certificates', permission: PERMISSIONS.MANAGE_CERTIFICATES },
      { to: '/achievements', label: 'Achievements', permission: PERMISSIONS.MANAGE_ACHIEVEMENTS },
      { to: '/emails', label: 'Emails', permission: PERMISSIONS.VIEW_REPORTS },
      { to: '/audit-logs', label: 'Audit logs', permission: PERMISSIONS.VIEW_AUDIT_LOGS },
      { to: '/users', label: 'Users & roles', permission: PERMISSIONS.MANAGE_ROLES },
    ],
  },
];

export function AdminLayout() {
  // `identity` (decoded from the stored token) survives a page reload;
  // `user` (the full PublicUser from the login response) is only set right
  // after a fresh login — identity.email is the reliable one to show here.
  const { identity, logout } = useAuth();

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    links: section.links.filter(
      (link) => !link.permission || hasPermission(identity, link.permission),
    ),
  })).filter((section) => section.links.length > 0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">SCD</span>
          <span>Admin</span>
        </div>
        <nav>
          {visibleSections.map((section) => (
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
