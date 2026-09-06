import { Link } from 'react-router-dom';
import { useEvent, useSocialLinks } from '../../lib/queries.js';

const FOOTER_LINKS: { to: string; label: string }[] = [
  { to: '/', label: 'Home' },
  { to: '/#about', label: 'About' },
  { to: '/speakers', label: 'Speakers' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/venue', label: 'Venue' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/past-events', label: 'Past Events' },
  { to: '/faq', label: 'FAQ' },
];

const DEFAULT_TAGLINE =
  'A student-run, community-organized day of AWS talks, workshops, and networking — built by and for the campus developer community.';

export function Footer() {
  const year = new Date().getFullYear();
  const { data: event } = useEvent();
  const { items: socialLinks } = useSocialLinks();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div className="footer-brand">
            <span className="brand-mark">SCD</span>
            <span>AWS Student Community Day 2026</span>
          </div>
          <p className="footer-tagline">{event?.footerText || DEFAULT_TAGLINE}</p>
          {(event?.contactEmail || event?.contactPhone) && (
            <ul className="footer-links footer-contact">
              {event.contactEmail && (
                <li>
                  <a href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
                </li>
              )}
              {event.contactPhone && (
                <li>
                  <a href={`tel:${event.contactPhone}`}>{event.contactPhone}</a>
                </li>
              )}
            </ul>
          )}
          {socialLinks.length > 0 && (
            <ul className="footer-links footer-social">
              {socialLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target={link.openNewTab ? '_blank' : undefined} rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="footer-heading">Explore</h3>
          <ul className="footer-links">
            {FOOTER_LINKS.slice(0, 5).map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="footer-heading">Event</h3>
          <ul className="footer-links">
            {FOOTER_LINKS.slice(5).map((link) => (
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
