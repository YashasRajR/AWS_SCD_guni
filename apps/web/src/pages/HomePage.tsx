import { Link } from 'react-router-dom';
import type { AgendaItem, Announcement, EventConfig, Speaker } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { formatDate, formatDateTime } from '../lib/format.js';
import { useAuth } from '../lib/auth.js';

export function HomePage() {
  const { status } = useAuth();
  const { data: event, loading: eventLoading, notFound: noEvent } = useResource<EventConfig>('/event');
  const { items: announcements } = useResource<Announcement>('/announcements');
  const { items: speakers } = useResource<Speaker>('/speakers');
  const { items: agenda } = useResource<AgendaItem>('/agenda');

  const upcoming = [...agenda]
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);
  const featuredSpeakers = speakers.slice(0, 4);

  return (
    <div>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">AWS Student Community Day 2026</p>
          {eventLoading ? (
            <h1>Loading event details…</h1>
          ) : noEvent || !event ? (
            <>
              <h1>Details coming soon</h1>
              <p className="hero-lede">
                We&apos;re putting the finishing touches on this year&apos;s event. Check back shortly, or create
                an account now so you&apos;re ready to register the moment it opens.
              </p>
            </>
          ) : (
            <>
              <h1>{event.name}</h1>
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
            {status === 'signed-in' ? (
              <Link to="/dashboard" className="btn btn-primary btn-large">
                Go to my dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-large">
                  Register now
                </Link>
                <Link to="/schedule" className="btn btn-secondary btn-large">
                  View schedule
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {announcements.length > 0 && (
        <section className="section section-tight">
          <h2 className="section-title">Announcements</h2>
          <div className="announcement-list">
            {announcements.slice(0, 3).map((a) => (
              <article key={a.id} className={`announcement-card announcement-${a.priority.toLowerCase()}`}>
                <div className="announcement-head">
                  <strong>{a.title}</strong>
                  <span className="announcement-priority">{a.priority}</span>
                </div>
                <p>{a.message}</p>
              </article>
            ))}
          </div>
          {announcements.length > 3 && (
            <Link to="/announcements" className="btn-link">
              See all announcements →
            </Link>
          )}
        </section>
      )}

      {featuredSpeakers.length > 0 && (
        <section className="section">
          <div className="section-header-row">
            <h2 className="section-title">Speakers</h2>
            <Link to="/speakers" className="btn-link">
              View all →
            </Link>
          </div>
          <div className="card-grid">
            {featuredSpeakers.map((s) => (
              <div key={s.id} className="speaker-card">
                {s.profileImage ? (
                  <img src={s.profileImage} alt={s.name} className="speaker-photo" />
                ) : (
                  <div className="speaker-photo speaker-photo-placeholder">{s.name.charAt(0)}</div>
                )}
                <h3>{s.name}</h3>
                {(s.designation || s.organization) && (
                  <p className="speaker-role">
                    {s.designation}
                    {s.designation && s.organization ? ' · ' : ''}
                    {s.organization}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="section">
          <div className="section-header-row">
            <h2 className="section-title">Schedule</h2>
            <Link to="/schedule" className="btn-link">
              Full schedule →
            </Link>
          </div>
          <ul className="agenda-list">
            {upcoming.map((item) => (
              <li key={item.id} className="agenda-list-item">
                <span className="agenda-time">{formatDateTime(item.startTime)}</span>
                <span className="agenda-title">{item.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
