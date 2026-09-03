import { Link } from 'react-router-dom';

const FOOTER_LINKS: { to: string; label: string }[] = [
  { to: '/', label: 'Home' },
  { to: '/#about', label: 'About' },
  { to: '/speakers', label: 'Speakers' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/venue', label: 'Venue' },
  { to: '/faq', label: 'FAQ' },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div className="footer-brand">
            <span className="brand-mark">SCD</span>
            <span>AWS Student Community Day 2026</span>
          </div>
          <p className="footer-tagline">
            A student-run, community-organized day of AWS talks, workshops, and networking — built by and for the
            campus developer community.
          </p>
        </div>

        <div>
          <h3 className="footer-heading">Explore</h3>
          <ul className="footer-links">
            {FOOTER_LINKS.slice(0, 4).map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="footer-heading">Event</h3>
          <ul className="footer-links">
            {FOOTER_LINKS.slice(4).map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/register">Register Now</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {year} AWS Student Community Day. Organized by the student community — not an official AWS event.</span>
        <span>Ganpat University</span>
      </div>
    </footer>
  );
}
