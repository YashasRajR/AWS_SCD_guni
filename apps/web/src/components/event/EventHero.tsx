import { useAuth } from '../../lib/auth.js';
import { useEvent, useSessions, useSpeakers, useVenues } from '../../lib/queries.js';
import { formatDate } from '../../lib/format.js';
import { Button } from '../ui/Button.js';
import { Skeleton } from '../ui/Skeleton.js';

/**
 * The high-impact hero. Event name/description/date/venue come from
 * GET /api/v1/event; the stat cards only render counts we can honestly
 * derive from real public endpoints (speakers/sessions/venues) — never a
 * fabricated "attendees" or "community" number.
 */
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
    <section className="hero" style={heroStyle}>
      <div className="hero-inner">
        <span className="hero-eyebrow">AWS Student Community Day 2026</span>

        {eventLoading ? (
          <div style={{ width: '100%', maxWidth: 560 }}>
            <Skeleton height="3rem" />
          </div>
        ) : notFound || !event ? (
          <>
            <h1>Something big is coming to campus</h1>
            <p className="hero-lede">
              We&apos;re putting the finishing touches on this year&apos;s event details. Create an account now so
              you&apos;re ready to register the moment it opens.
            </p>
          </>
        ) : (
          <>
            <h1>{event.name}</h1>
            {event.heroSubtitle && <p className="hero-subtitle">{event.heroSubtitle}</p>}
            {event.description && <p className="hero-lede">{event.description}</p>}
            <dl className="hero-facts">
              <div>
                <dt>Date</dt>
                <dd>{formatDate(event.eventDate)}</dd>
              </div>
              {event.venue && (
                <div>
                  <dt>Venue</dt>
                  <dd>{event.venue}</dd>
                </div>
              )}
            </dl>
          </>
        )}

        <div className="hero-actions">
          {/* Admin-configured CTAs (spec: "every button must have an editable
           * destination") fall back to the signed-in-aware defaults when unset. */}
          {event?.primaryCtaUrl ? (
            <Button href={event.primaryCtaUrl} size="large">
              {event.primaryCtaLabel || 'Register Now'}
            </Button>
          ) : status === 'signed-in' ? (
            <Button to="/dashboard" size="large">
              Go to my dashboard
            </Button>
          ) : (
            <Button to="/register" size="large">
              Register Now
            </Button>
          )}
          {event?.secondaryCtaUrl ? (
            <Button href={event.secondaryCtaUrl} size="large" variant="secondary">
              {event.secondaryCtaLabel || 'Explore Agenda'}
            </Button>
          ) : (
            <Button to="/agenda" size="large" variant="secondary">
              Explore Agenda
            </Button>
          )}
        </div>

        {stats.length > 0 && (
          <dl className="hero-stats">
            {stats.map((s) => (
              <div key={s.label} className="hero-stat">
                <dt className="visually-hidden">{s.label}</dt>
                <dd className="hero-stat-value">{s.value}+</dd>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
