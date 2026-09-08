import { Link, useParams } from 'react-router-dom';
import { useAgenda, useSessions, useVenues } from '../lib/queries.js';
import { formatTime } from '../lib/format.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { SkeletonText } from '../components/ui/Skeleton.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { useDocumentHead } from '../lib/seo.js';

const TYPE_LABELS: Record<string, string> = {
  KEYNOTE: 'Keynote',
  TALK: 'Talk',
  WORKSHOP: 'Workshop',
  PANEL: 'Panel',
  BREAK: 'Break',
};

/**
 * Wireframe 1b "/sessions/:id": a full page for one session, joined
 * client-side to its agenda slot (time/room) and speakers -- the same
 * pattern AgendaList already uses. No "difficulty" or "prerequisites" here:
 * neither field exists on the real Session model, so they're left out
 * rather than invented. "Add to my sessions" is likewise omitted -- there's
 * no save-a-session feature anywhere in this app to back that button, and
 * a button that does nothing is worse than not having it.
 */
export function SessionDetailPage() {
  const { id } = useParams();
  const { items: sessions, loading, error, reload } = useSessions();
  const { items: agenda } = useAgenda();
  const { items: venues } = useVenues();

  const session = sessions.find((s) => s.id === id);
  const slot = agenda.find((a) => a.sessionId === id);
  const venue = slot?.venueId ? venues.find((v) => v.id === slot.venueId) : undefined;
  const related = session
    ? sessions.filter((s) => s.id !== session.id && s.track && s.track === session.track).slice(0, 3)
    : [];

  useDocumentHead({ title: session ? session.title : 'Session' });

  return (
    <div className="section">
      <PageContainer>
        <p className="dashboard-card-meta">
          <Link to="/sessions">Sessions</Link> / {session?.title ?? '…'}
        </p>

        {loading && <SkeletonText lines={4} />}
        {error && <ErrorState onRetry={reload} />}

        {!loading && !error && !session && (
          <div className="empty-state">
            <p>This session couldn&apos;t be found.</p>
            <Link to="/sessions" className="btn-link">
              Back to all sessions
            </Link>
          </div>
        )}

        {session && (
          <article className="session-detail">
            <div className="session-card-head">
              <span className="badge badge-info">{TYPE_LABELS[session.sessionType] ?? session.sessionType}</span>
              {session.track && <span className="badge badge-neutral">{session.track}</span>}
            </div>
            <h1>{session.title}</h1>
            <p className="dashboard-card-meta">
              {slot ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : ''}
              {session.durationMinutes ? `${slot ? ' · ' : ''}${session.durationMinutes} min` : ''}
              {venue ? ` · ${venue.name}` : ''}
            </p>

            {session.description && <p className="session-description">{session.description}</p>}

            {session.speakers && session.speakers.length > 0 && (
              <div className="session-detail-speakers">
                <h2>Speaker{session.speakers.length > 1 ? 's' : ''}</h2>
                <ul className="dashboard-links">
                  {session.speakers.map((sp) => (
                    <li key={sp.id}>
                      <Link to={`/speakers/${sp.id}`}>{sp.name}</Link>
                      {(sp.designation || sp.organization) && (
                        <span className="dashboard-card-meta">
                          {' '}
                          — {sp.designation}
                          {sp.designation && sp.organization ? ' · ' : ''}
                          {sp.organization}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {related.length > 0 && (
              <div className="session-detail-related">
                <h2>Related sessions</h2>
                <ul className="dashboard-links">
                  {related.map((s) => (
                    <li key={s.id}>
                      <Link to={`/sessions/${s.id}`}>{s.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </PageContainer>
    </div>
  );
}
