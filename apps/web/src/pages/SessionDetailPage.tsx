import { Link, useParams } from 'react-router-dom';
import { useAgenda, useSessions, useVenues } from '../lib/queries.js';
import { formatTime } from '../lib/format.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { SkeletonText } from '../components/ui/Skeleton.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { useDocumentHead } from '../lib/seo.js';
import { useSavedSessions } from '../lib/useSavedSessions.js';
import { useToast } from '../lib/toast.js';

const TYPE_LABELS: Record<string, string> = {
  KEYNOTE: 'Keynote',
  TALK: 'Talk',
  WORKSHOP: 'Workshop',
  PANEL: 'Panel',
  BREAK: 'Break',
};

export function SessionDetailPage() {
  const { id } = useParams();
  const { items: sessions, loading, error, reload } = useSessions();
  const { items: agenda } = useAgenda();
  const { items: venues } = useVenues();
  const { isSaved, toggleSession } = useSavedSessions();
  const { addToast } = useToast();

  const session = sessions.find((s) => s.id === id);
  const slot = agenda.find((a) => a.sessionId === id);
  const venue = slot?.venueId ? venues.find((v) => v.id === slot.venueId) : undefined;
  const related = session
    ? sessions.filter((s) => s.id !== session.id && s.track && s.track === session.track).slice(0, 3)
    : [];

  const saved = session ? isSaved(session.id) : false;

  const handleSaveToggle = () => {
    if (!session) return;
    toggleSession(session.id);
    if (!saved) {
      addToast('Added to your saved sessions', 'success');
    } else {
      addToast('Removed from saved sessions', 'info');
    }
  };

  useDocumentHead({ title: session ? session.title : 'Session' });

  return (
    <div className="section" style={{ padding: '32px 0 60px' }}>
      <PageContainer>
        <p className="mo" style={{ color: 'var(--scd-muted)', marginBottom: '16px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> /{' '}
          <Link to="/sessions" style={{ color: 'inherit', textDecoration: 'none' }}>Sessions</Link> /{' '}
          <span style={{ color: 'var(--scd-fg)' }}>{session?.title ?? '…'}</span>
        </p>

        {loading && <SkeletonText lines={6} />}
        {error && <ErrorState onRetry={reload} />}

        {!loading && !error && !session && (
          <EmptyState
            message="This session couldn't be found."
            action={
              <Link to="/sessions" className="btn o" style={{ textDecoration: 'none' }}>
                Back to all sessions
              </Link>
            }
          />
        )}

        {session && (
          <article className="c" style={{ gap: '20px', maxWidth: '800px' }}>
            <div className="k" style={{ gap: '16px', padding: '24px' }}>
              <div className="r" style={{ gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="chip on">{TYPE_LABELS[session.sessionType] ?? session.sessionType}</span>
                {session.track && <span className="chip">{session.track}</span>}
              </div>

              <h1 className="d1" style={{ fontSize: '28px', margin: 0 }}>
                {session.title}
              </h1>

              <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '13px' }}>
                {slot ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : 'Time TBA'}
                {session.durationMinutes ? ` · ${session.durationMinutes} min` : ''}
                {venue ? ` · ${venue.name}` : ' · Room TBA'}
              </p>

              {session.speakers && session.speakers.length > 0 && (
                <div className="kd" style={{ background: 'var(--scd-surface-muted)', padding: '12px' }}>
                  <p className="mo" style={{ fontSize: '11px', marginBottom: '8px' }}>Speaker</p>
                  <div className="c" style={{ gap: '8px' }}>
                    {session.speakers.map((sp) => (
                      <div key={sp.id} className="r" style={{ alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '999px',
                            background: 'var(--scd-primary)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--scd-mono)',
                            fontWeight: 700,
                            fontSize: '14px',
                          }}
                        >
                          {sp.name.charAt(0)}
                        </div>
                        <div className="c" style={{ gap: '2px' }}>
                          <Link to={`/speakers/${sp.id}`} className="lbl" style={{ textDecoration: 'none', color: 'var(--scd-fg)' }}>
                            {sp.name}
                          </Link>
                          {(sp.designation || sp.organization) && (
                            <p className="mo" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>
                              {sp.designation}
                              {sp.designation && sp.organization ? ' · ' : ''}
                              {sp.organization}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {session.description && (
                <div className="c" style={{ gap: '8px' }}>
                  <p className="mo" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>About this session</p>
                  <p className="tx" style={{ fontSize: '14px', lineHeight: 1.6 }}>{session.description}</p>
                </div>
              )}

              <div className="kd" style={{ background: 'var(--scd-surface)', gap: '4px' }}>
                <p className="mo" style={{ fontSize: '11px' }}>Prerequisites &amp; what to bring</p>
                <p className="tx">A laptop with WiFi and browser access. No prior cloud experience required.</p>
              </div>

              <div className="r" style={{ gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleSaveToggle}
                  className={`btn ${saved ? 'o' : ''}`}
                  style={{ minHeight: '44px', padding: '0 20px', cursor: 'pointer' }}
                  aria-pressed={saved}
                >
                  {saved ? '✓ In my sessions' : 'Add to my sessions'}
                </button>
                <Link to="/sessions" className="btn g" style={{ minHeight: '44px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  ← All sessions
                </Link>
              </div>
            </div>

            {related.length > 0 && (
              <div className="k mut" style={{ padding: '20px', gap: '12px' }}>
                <p className="mo" style={{ color: 'var(--scd-muted)' }}>Related sessions in {session.track}</p>
                <div className="c" style={{ gap: '8px' }}>
                  {related.map((s) => (
                    <div key={s.id} className="kd" style={{ background: 'var(--scd-surface)' }}>
                      <Link to={`/sessions/${s.id}`} className="lbl" style={{ textDecoration: 'none', color: 'var(--scd-fg)' }}>
                        {s.title} →
                      </Link>
                      <p className="mo" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>
                        {TYPE_LABELS[s.sessionType] ?? s.sessionType}
                        {s.durationMinutes ? ` · ${s.durationMinutes} min` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </PageContainer>
    </div>
  );
}
