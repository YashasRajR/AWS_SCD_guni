import type { AgendaItem, Session, Venue } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { formatTime, groupByDay } from '../lib/format.js';

export function SchedulePage() {
  const { items: agenda, loading, error } = useResource<AgendaItem>('/agenda');
  const { items: sessions } = useResource<Session>('/sessions');
  const { items: venues } = useResource<Venue>('/venues');

  const sessionsById = new Map(sessions.map((s) => [s.id, s]));
  const venuesById = new Map(venues.map((v) => [v.id, v]));

  const sorted = [...agenda].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const grouped = groupByDay(sorted, (item) => item.startTime);

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>Schedule</h1>
        <p className="page-section-lede">The detailed, time-by-time run of the day.</p>
      </header>

      {loading && <p className="status-line">Loading schedule…</p>}
      {error && <p className="status-line status-error">{error}</p>}
      {!loading && !error && agenda.length === 0 && (
        <p className="status-line">The schedule will be published soon.</p>
      )}

      {[...grouped.entries()].map(([day, items]) => (
        <div key={day} className="schedule-day">
          <h2 className="schedule-day-title">{day}</h2>
          <ol className="schedule-list">
            {items.map((item) => {
              const session = item.sessionId ? sessionsById.get(item.sessionId) : undefined;
              const venue = item.venueId ? venuesById.get(item.venueId) : undefined;
              return (
                <li key={item.id} className="schedule-item">
                  <div className="schedule-item-time">
                    {formatTime(item.startTime)} – {formatTime(item.endTime)}
                  </div>
                  <div className="schedule-item-body">
                    <strong>{item.title}</strong>
                    {session?.speakers && session.speakers.length > 0 && (
                      <span className="schedule-item-meta">{session.speakers.map((sp) => sp.name).join(', ')}</span>
                    )}
                    {venue && <span className="schedule-item-meta">{venue.name}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
