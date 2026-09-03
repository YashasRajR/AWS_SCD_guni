import type { Session } from '@scd/types';

const TYPE_LABELS: Record<string, string> = {
  KEYNOTE: 'Keynote',
  TALK: 'Talk',
  WORKSHOP: 'Workshop',
  PANEL: 'Panel',
  BREAK: 'Break',
};

export function SessionCard({ session }: { session: Session }) {
  return (
    <article className="session-card">
      <div className="session-card-head">
        <span className="badge badge-info">{TYPE_LABELS[session.sessionType] ?? session.sessionType}</span>
        {session.track && <span className="badge badge-neutral">{session.track}</span>}
        {session.durationMinutes && <span className="session-duration">{session.durationMinutes} min</span>}
      </div>
      <h3>{session.title}</h3>
      {session.description && <p className="session-description">{session.description}</p>}
      {session.speakers && session.speakers.length > 0 && (
        <p className="session-speakers">{session.speakers.map((sp) => sp.name).join(', ')}</p>
      )}
    </article>
  );
}
