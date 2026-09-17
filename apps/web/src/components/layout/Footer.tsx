import { Link } from 'react-router-dom';
import { useEvent, useSocialLinks } from '../../lib/queries.js';
import { Mascot } from '../ui/Mascot.js';

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

export function Footer() {
  const year = new Date().getFullYear();
  const { data: event } = useEvent();
  const { items: socialLinks } = useSocialLinks();

  return (
    <footer className="site-footer inv" style={{ borderTop: '2px solid var(--accent)', padding: '48px 0 24px' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Top Lockup Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p className="d2" style={{ color: '#fff', fontSize: '24px' }}>
              AWS Students<br />Community Day 2026
            </p>
            <p className="mo" style={{ color: '#FF9900' }}>
              Ganpat University · Mehsana, Gujarat · 8 October 2026
            </p>
            <p className="mo" style={{ color: '#cfc9be' }}>
              @aws.sbg_guni · {event?.contactEmail || 'awscloudclub@ganpatuniversity.ac.in'}
            </p>
          </div>
          <Mascot variant="wave" size={68} />
        </div>

        {/* Partner / Organization Badges */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="kd" style={{ flex: 1, minWidth: '120px', alignItems: 'center', textAlign: 'center', borderColor: 'rgba(255,255,255,0.25)', padding: '10px' }}>
            <p className="lbl" style={{ color: '#fff' }}>GUNI</p>
            <p className="mo" style={{ fontSize: '0.65rem', color: '#cfc9be' }}>Ganpat University</p>
          </div>
          <div className="kd" style={{ flex: 1, minWidth: '120px', alignItems: 'center', textAlign: 'center', borderColor: 'rgba(255,255,255,0.25)', padding: '10px' }}>
            <p className="lbl" style={{ color: '#fff' }}>CoE</p>
            <p className="mo" style={{ fontSize: '0.65rem', color: '#cfc9be' }}>Centre of Excellence</p>
          </div>
          <div className="kd" style={{ flex: 1, minWidth: '120px', alignItems: 'center', textAlign: 'center', borderColor: 'rgba(255,255,255,0.25)', padding: '10px' }}>
            <p className="lbl" style={{ color: '#fff' }}>AWS SBG</p>
            <p className="mo" style={{ fontSize: '0.65rem', color: '#FF9900' }}>Student Builders Group</p>
          </div>
        </div>

        {/* Link Columns */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div>
            <p className="mo" style={{ color: '#FF9900', marginBottom: '10px' }}>Explore</p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              {FOOTER_LINKS.slice(0, 5).map((link) => (
                <li key={link.to}>
                  <Link to={link.to} style={{ color: '#cfc9be', textDecoration: 'none', fontSize: '0.88rem' }} className="footer-nav-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mo" style={{ color: '#FF9900', marginBottom: '10px' }}>Event</p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              {FOOTER_LINKS.slice(5).map((link) => (
                <li key={link.to}>
                  <Link to={link.to} style={{ color: '#cfc9be', textDecoration: 'none', fontSize: '0.88rem' }} className="footer-nav-link">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/register" style={{ color: '#FF9900', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
                  Register →
                </Link>
              </li>
            </ul>
          </div>

          {socialLinks.length > 0 && (
            <div>
              <p className="mo" style={{ color: '#FF9900', marginBottom: '10px' }}>Community</p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {socialLinks.map((link) => (
                  <li key={link.id}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#cfc9be', textDecoration: 'none', fontSize: '0.85rem' }}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Legal / Disclaimer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="mo" style={{ color: 'rgba(207, 201, 190, 0.7)', fontSize: '0.72rem' }}>
            © {year} AWS Student Community Day. Organized by the student community — not an official AWS event.
          </p>
          <p className="mo" style={{ color: 'rgba(207, 201, 190, 0.7)', fontSize: '0.72rem' }}>
            Ganpat Vidyanagar, Mehsana, Gujarat 384012
          </p>
        </div>
      </div>
    </footer>
  );
}
