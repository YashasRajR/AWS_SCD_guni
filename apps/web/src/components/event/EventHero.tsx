import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth.js';
import { useEvent, useSessions, useSpeakers, useVenues } from '../../lib/queries.js';
import { formatDate } from '../../lib/format.js';
import { CountdownTimer } from './CountdownTimer.js';
import { Mascot } from '../ui/Mascot.js';
import { ShapeGrid } from '../ui/ShapeGrid.js';

export function EventHero() {
  const { data: event, loading: eventLoading, notFound } = useEvent();
  const { status } = useAuth();
  const { items: speakers } = useSpeakers();
  const { items: sessions } = useSessions();
  const { items: venues } = useVenues();

  const stats = [
    { label: 'Speakers', value: speakers.length },
    { label: 'Sessions', value: sessions.length },
    { label: 'Venues', value: venues.length },
  ].filter((s) => s.value > 0);

  const heroStyle = event?.heroBackgroundImage
    ? {
        backgroundImage: `url(${event.heroBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : undefined;

  return (
    <section className="hero" style={{ ...heroStyle, padding: '48px 0 36px', borderBottom: '1px solid var(--border)' }}>
      <div className="hero-shapegrid">
        <ShapeGrid
          direction="diagonal"
          speed={0.4}
          squareSize={40}
          shape="square"
          borderColor="rgba(80, 55, 122, 0.15)"
          hoverFillColor="rgba(255, 153, 0, 0.35)"
          hoverTrailAmount={4}
        />
      </div>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {eventLoading ? (
          <div style={{ minHeight: '260px', display: 'flex', alignItems: 'center' }}>
            <p className="mo">Loading event details…</p>
          </div>
        ) : notFound || !event ? (
          <div className="hero-inner" style={{ maxWidth: '640px' }}>
            <h1 className="d1" style={{ fontSize: '32px' }}>Something big is coming to campus</h1>
            <p className="tx" style={{ marginTop: '12px', color: 'var(--muted)' }}>
              We&apos;re putting the finishing touches on this year&apos;s event details. Create an account now so
              you&apos;re ready to register the moment it opens.
            </p>
            <div className="r" style={{ marginTop: '20px', gap: '10px' }}>
              <Link to="/register" className="btn o hero-cta-pulse">
                Register Now →
              </Link>
              <Link to="/agenda" className="btn g">
                Explore Agenda
              </Link>
            </div>
          </div>
        ) : (
          <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            {/* Left Column: Heading, Countdown, Actions */}
            <div className="c" style={{ flex: '1 1 500px', maxWidth: '640px', gap: '18px' }}>
              <p className="mo" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                {event.eventDate ? formatDate(event.eventDate) : '8 October 2026'} · {event.venue || 'Ganpat University, Mehsana'}
              </p>

              <div>
                <h1
                  className="hero-title"
                  aria-label={event.name || 'AWS Student Community Day 2026'}
                >
                  <span className="hero-title-line">AWS</span>
                  <span className="hero-title-accent">Students</span>
                  <span className="hero-title-line">COMMUNITY</span>
                  <span className="hero-title-line">DAY</span>
                </h1>
                {event.description && (
                  <p className="tx" style={{ marginTop: '12px', color: 'var(--muted)', maxWidth: '54ch' }}>
                    {event.description}
                  </p>
                )}
              </div>

              {/* Countdown Flip Tiles */}
              <div style={{ marginTop: '4px' }}>
                <CountdownTimer targetDate={event.eventDate} />
              </div>

              {/* Action Buttons */}
              <div className="r" style={{ gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                {event?.primaryCtaUrl ? (
                  <a href={event.primaryCtaUrl} className="btn o hero-cta-pulse">
                    {event.primaryCtaLabel || 'Register Now →'}
                  </a>
                ) : status === 'signed-in' ? (
                  <Link to="/dashboard" className="btn o hero-cta-pulse">
                    Go to my dashboard →
                  </Link>
                ) : (
                  <Link to="/register" className="btn o hero-cta-pulse">
                    Register Now →
                  </Link>
                )}

                {event?.secondaryCtaUrl ? (
                  <a href={event.secondaryCtaUrl} className="btn g">
                    {event.secondaryCtaLabel || 'Explore Agenda'}
                  </a>
                ) : (
                  <Link to="/agenda" className="btn g">
                    Explore Agenda
                  </Link>
                )}
              </div>

              {/* Stats badges if populated */}
              {stats.length > 0 && (
                <div className="r" style={{ gap: '16px', marginTop: '8px' }}>
                  {stats.map((s) => (
                    <div key={s.label} className="kd" style={{ padding: '6px 12px' }}>
                      <p className="d3" style={{ fontSize: '18px', color: 'var(--accent)' }}>{s.value}+</p>
                      <p className="mo" style={{ fontSize: '0.65rem' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Vertical Year & Mascot */}
            <div
              className="c"
              style={{
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                minWidth: '180px',
                height: '100%',
                display: 'flex',
              }}
            >
              <div
                className="d2"
                style={{
                  writingMode: 'vertical-rl',
                  fontSize: 'clamp(28px, 4vw, 42px)',
                  letterSpacing: '0.12em',
                  color: 'var(--primary)',
                  opacity: 0.85,
                  alignSelf: 'flex-end',
                }}
              >
                2026
              </div>
              <div style={{ marginTop: '16px' }}>
                <Mascot variant="wave" size={135} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
