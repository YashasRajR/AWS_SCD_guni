import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { SiteLink } from '@scd/types';
import { useAuth } from '../../lib/auth.js';
import { useEvent, useNavLinks } from '../../lib/queries.js';
import { Button } from '../ui/Button.js';

interface NavLinkDef {
  to: string;
  label: string;
  end?: boolean;
  anchor?: boolean;
}

const NAV_LINKS: NavLinkDef[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/#about', label: 'About', anchor: true },
  { to: '/speakers', label: 'Speakers' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/venue', label: 'Venue' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/past-events', label: 'Past Events' },
  { to: '/faq', label: 'FAQ' },
];

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Renders the admin-configured nav links (GET /nav-links) when any are
 * published, falling back to the original hard-coded set otherwise -- so
 * the header still works before an admin has added any CMS nav items. */
function NavLinks({ links, onNavigate }: { links: SiteLink[]; onNavigate: () => void }) {
  if (links.length > 0) {
    return (
      <>
        {links.map((link) =>
          link.isExternal ? (
            <a
              key={link.id}
              href={link.url}
              className="nav-link"
              target={link.openNewTab ? '_blank' : undefined}
              rel={link.openNewTab ? 'noopener noreferrer' : undefined}
              onClick={onNavigate}
            >
              {link.label}
            </a>
          ) : (
            <NavLink
              key={link.id}
              to={link.url}
              className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
              onClick={onNavigate}
            >
              {link.label}
            </NavLink>
          ),
        )}
      </>
    );
  }

  return (
    <>
      {NAV_LINKS.map((link) =>
        link.anchor ? (
          <a key={link.to} href={link.to} className="nav-link" onClick={onNavigate}>
            {link.label}
          </a>
        ) : (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
            onClick={onNavigate}
          >
            {link.label}
          </NavLink>
        ),
      )}
    </>
  );
}

function AuthLinks({ onNavigate }: { onNavigate: () => void }) {
  const { status, logout } = useAuth();
  const navigate = useNavigate();

  if (status === 'signed-in') {
    return (
      <>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
          onClick={onNavigate}
        >
          Dashboard
        </NavLink>
        <button
          type="button"
          className="btn btn-outline btn-small"
          onClick={() => {
            logout();
            onNavigate();
            navigate('/');
          }}
        >
          Log out
        </button>
      </>
    );
  }

  return (
    <>
      <NavLink to="/login" className="nav-link" onClick={onNavigate}>
        Log in
      </NavLink>
      <Button to="/register" size="small" onClick={onNavigate}>
        Register Now
      </Button>
    </>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { items: navLinks } = useNavLinks();
  const { data: event } = useEvent();

  const closeMenu = () => setMenuOpen(false);

  // Lock body scroll while the mobile menu is open, and restore it on close.
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  // Focus trap: move focus into the panel on open, cycle Tab within it,
  // close on Escape, and return focus to the toggle button on close.
  useEffect(() => {
    if (!menuOpen) return;
    const panel = panelRef.current;
    const focusables = panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];
    focusables[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab' || focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      toggleRef.current?.focus();
    }
  }, [menuOpen]);

  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="site-header-row">
        <NavLink to="/" className="brand" onClick={closeMenu}>
          {event?.logoUrl ? (
            <img src={event.logoUrl} alt="" className="brand-logo" />
          ) : (
            <span className="brand-mark">SCD</span>
          )}
          <span className="brand-name">AWS Student Community Day</span>
        </NavLink>

        <nav className="desktop-nav" aria-label="Primary">
          <NavLinks links={navLinks} onNavigate={closeMenu} />
        </nav>

        <div className="nav-auth">
          <AuthLinks onNavigate={closeMenu} />
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-panel"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={closeMenu} />
          <div
            id="mobile-nav-panel"
            className="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            ref={panelRef}
          >
            <div className="mobile-nav-head">
              <button type="button" className="menu-toggle" aria-label="Close navigation menu" onClick={closeMenu}>
                <span style={{ transform: 'translateY(7px) rotate(45deg)' }} />
                <span style={{ opacity: 0 }} />
                <span style={{ transform: 'translateY(-7px) rotate(-45deg)' }} />
              </button>
            </div>
            <nav aria-label="Mobile primary" style={{ display: 'flex', flexDirection: 'column' }}>
              <NavLinks links={navLinks} onNavigate={closeMenu} />
              <div className="nav-auth">
                <AuthLinks onNavigate={closeMenu} />
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
