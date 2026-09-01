import type { Session } from '@scd/types';
import { useResource } from '../lib/hooks.js';

const TYPE_LABELS: Record<string, string> = {
  KEYNOTE: 'Keynote',
  TALK: 'Talk',
  WORKSHOP: 'Workshop',
  PANEL: 'Panel',
  BREAK: 'Break',
};

export function SessionsPage() {
  const { items: sessions, loading, error } = useResource<Session>('/sessions');

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>Sessions</h1>
        <p className="page-section-lede">Talks, workshops, and panels happening this year.</p>
      </header>

      {loading && <p className="status-line">Loading sessions…</p>}
      {error && <p className="status-line status-error">{error}</p>}
      {!loading && !error && sessions.length === 0 && (
        <p className="status-line">The session list will be published soon.</p>
      )}

      <div className="session-list">
        {sessions.map((s) => (
          <article key={s.id} className="session-card">
            <div className="session-card-head">
              <span className="badge badge-blue">{TYPE_LABELS[s.sessionType] ?? s.sessionType}</span>
              {s.track && <span className="badge badge-gray">{s.track}</span>}
              {s.durationMinutes && <span className="session-duration">{s.durationMinutes} min</span>}
            </div>
            <h3>{s.title}</h3>
            {s.description && <p className="session-description">{s.description}</p>}
            {s.speakers && s.speakers.length > 0 && (
              <p className="session-speakers">
                {s.speakers.map((sp) => sp.name).join(', ')}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
