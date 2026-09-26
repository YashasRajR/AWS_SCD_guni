import { Link } from 'react-router-dom';
import { useEvent } from '../../lib/queries.js';
import { formatDate } from '../../lib/format.js';
import { CountdownTimer } from './CountdownTimer.js';
import { CloudQuestGameBoy } from '../ui/CloudQuestGameBoy.js';
import { ShapeGrid } from '../ui/ShapeGrid.js';

export function EventHero() {
  const { data: event, loading: eventLoading, notFound } = useEvent();

  const heroStyle = event?.heroBackgroundImage
    ? {
        backgroundImage: `url(${event.heroBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : undefined;

  return (
    <section className="hero" style={{ ...heroStyle, padding: '16px 0 10px', borderBottom: '1px solid var(--border)' }}>
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
      <div className="container hero-container" style={{ position: 'relative', zIndex: 1 }}>
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
          <div className="hero-layout-row">
            {/* Left Column: Heading, Countdown, Actions */}
            <div className="hero-content-col">
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
                  <p className="tx" style={{ marginTop: '6px', color: 'var(--muted)', maxWidth: '48ch', fontSize: '0.92rem', lineHeight: 1.4 }}>
                    {event.description}
                  </p>
                )}
              </div>

              {/* Countdown Flip Tiles */}
              <div style={{ marginTop: '2px' }}>
                <CountdownTimer targetDate={event.eventDate} />
              </div>

              {/* Action Buttons */}
              <div className="r" style={{ gap: '10px', flexWrap: 'wrap', marginTop: '2px' }}>
                {event?.primaryCtaUrl ? (
                  <a href={event.primaryCtaUrl} className="btn o hero-cta-pulse">
                    {event.primaryCtaLabel || 'Register Now →'}
                  </a>
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
            </div>

            {/* Right Column: 2026 with each number on a newline beside the Playable Game Boy Console */}
            <div className="hero-game-wrapper">
              <div className="hero-vertical-year" aria-label="2026">
                <span>2</span>
                <span>0</span>
                <span>2</span>
                <span>6</span>
              </div>

              {/* Playable Cloud Quest Game Boy Console */}
              <CloudQuestGameBoy />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
