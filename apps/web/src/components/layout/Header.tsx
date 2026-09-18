import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import type { SiteLink } from '@scd/types';
import { useAuth } from '../../lib/auth.js';
import { useNavLinks, useSocialLinks } from '../../lib/queries.js';
import { Mascot } from '../ui/Mascot.js';
import { BuilderMark } from '../ui/BuilderMark.js';

interface NavLinkDef {
  to: string;
  label: string;
  num: string;
  end?: boolean;
  anchor?: boolean;
}

const SECTION_LINKS: NavLinkDef[] = [
  { to: '/', label: 'Home', num: '01', end: true },
  { to: '/#about', label: 'About', num: '02', anchor: true },
  { to: '/sessions', label: 'Sessions', num: '03' },
  { to: '/agenda', label: 'Agenda', num: '04' },
  { to: '/speakers', label: 'Speakers', num: '05' },
  { to: '/timeline', label: 'Timeline', num: '06' },
  { to: '/venue', label: 'Venue', num: '07' },
  { to: '/gallery', label: 'Gallery', num: '08' },
  { to: '/past-events', label: 'Past Events', num: '09' },
  { to: '/faq', label: 'FAQ', num: '10' },
];

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { items: customNavLinks } = useNavLinks();
  const { items: socialLinks } = useSocialLinks();
  const { status, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const closeMenu = () => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  };

  // Scroll listener for compact header past 80px and scroll progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 80);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollY / docHeight) * 100)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  // Focus trap & Escape key for mobile menu
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

  return (
    <>
      {/* Mobile Scroll Progress Indicator */}
      <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} aria-hidden="true" />

      {/* Desktop Section Index Rail (shown on large screens on homepage) */}
      {isHome && (
        <nav className="section-index-rail" aria-label="Section navigation">
          {SECTION_LINKS.slice(0, 7).map((item) => (
            <a key={item.num} href={item.anchor ? item.to : `#${item.label.toLowerCase()}`} className="section-rail-item">
              <span className="section-rail-dot" />
              <span>{item.num}</span>
            </a>
          ))}
        </nav>
      )}

      <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div className="site-header-row">
          <NavLink to="/" className="brand" onClick={closeMenu} aria-label="AWS Student Community Day Home">
            <BuilderMark size={22} className="brand-builder-mark" />
            <img src="/guni-logo.png" alt="Ganpat University Centre of Excellence" className="brand-logo" />
            <Mascot variant="lockup" size={30} />
          </NavLink>

          <nav className="desktop-nav" aria-label="Primary">
            {customNavLinks.length > 0
              ? customNavLinks.map((link: SiteLink) =>
                  link.isExternal ? (
                    <a
                      key={link.id}
                      href={link.url}
                      className="mo nav-link"
                      target={link.openNewTab ? '_blank' : undefined}
                      rel={link.openNewTab ? 'noopener noreferrer' : undefined}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <NavLink
                      key={link.id}
                      to={link.url}
                      className={({ isActive }) => (isActive ? 'mo nav-link nav-link-active' : 'mo nav-link')}
                    >
                      {link.label}
                    </NavLink>
                  ),
                )
              : SECTION_LINKS.slice(0, 7).map((link) =>
                  link.anchor ? (
                    <a key={link.to} href={link.to} className="mo nav-link">
                      {link.label}
                    </a>
                  ) : (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) => (isActive ? 'mo nav-link nav-link-active' : 'mo nav-link')}
                    >
                      {link.label}
                    </NavLink>
                  ),
                )}
          </nav>

          <div className="nav-auth" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {status === 'signed-in' ? (
              <>
                <Link to="/dashboard" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                  Dashboard
                </Link>
                <button
                  type="button"
                  className="btn btn.g"
                  style={{ padding: '6px 10px', fontSize: '0.72rem' }}
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="mo nav-link" style={{ display: 'inline-block' }}>
                  Log in
                </NavLink>
                <Link to="/register" className="btn o" style={{ padding: '7px 14px', fontSize: '0.78rem' }}>
                  Register
                </Link>
              </>
            )}

            <button
              ref={toggleRef}
              type="button"
              className="menu-toggle"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-fullscreen"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Full-Screen Mobile Navigation Overlay (Wireframe 1l) */}
        {menuOpen && (
          <div
            id="mobile-nav-fullscreen"
            className="mobile-nav-fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            ref={panelRef}
          >
            <div className="mobile-nav-fullscreen-head">
              <NavLink to="/" onClick={closeMenu}>
                <Mascot variant="lockup" size={28} />
              </NavLink>
              <button
                type="button"
                className="btn btn.g"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', padding: '6px 12px' }}
                onClick={closeMenu}
                aria-label="Close navigation"
              >
                Close ✕
              </button>
            </div>

            <nav className="mobile-nav-items" aria-label="Mobile primary navigation">
              {SECTION_LINKS.map((item, index) => {
                const isItemActive = location.pathname === item.to;
                return item.anchor ? (
                  <a
                    key={item.to}
                    href={item.to}
                    aria-label={item.label}
                    className="mobile-nav-item"
                    onClick={closeMenu}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <span className="mo">{item.num}</span>
                    <span className="d1" style={{ fontSize: '28px' }}>
                      {item.label}
                    </span>
                    <span className="mobile-nav-caret">›</span>
                  </a>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    aria-label={item.label}
                    className="mobile-nav-item"
                    onClick={closeMenu}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <span className="mo">{item.num}</span>
                    <span className="d1" style={{ fontSize: '28px' }}>
                      {item.label}
                    </span>
                    {isItemActive && <span className="scr">●</span>}
                    <span className="mobile-nav-caret">›</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mobile-nav-fullscreen-footer">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {status === 'signed-in' ? (
                  <Link to="/dashboard" className="btn o" onClick={closeMenu}>
                    My Dashboard →
                  </Link>
                ) : (
                  <Link to="/register" className="btn o" onClick={closeMenu}>
                    Register now →
                  </Link>
                )}
                <p className="mo" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  @aws.sbg_guni · GUNI Mehsana
                </p>
                {socialLinks[0] && (
                  <a
                    href={socialLinks[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mo"
                    style={{ color: 'var(--accent)' }}
                  >
                    {socialLinks[0].label}
                  </a>
                )}
              </div>
              <Mascot variant="default" size={64} />
            </div>
          </div>
        )}
      </header>
    </>
  );
}
