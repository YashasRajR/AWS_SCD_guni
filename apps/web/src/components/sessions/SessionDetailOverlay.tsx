import { Link } from 'react-router-dom';
import type { Session } from '@scd/types';
import { useAgenda, useSessions, useVenues } from '../../lib/queries.js';
import { formatTime } from '../../lib/format.js';
import { useSavedSessions } from '../../lib/useSavedSessions.js';
import { useToast } from '../../lib/toast.js';
import { SlideOver } from '../ui/SlideOver.js';

const TYPE_LABELS: Record<string, string> = {
  KEYNOTE: 'Keynote',
  TALK: 'Talk',
  WORKSHOP: 'Workshop',
  PANEL: 'Panel',
  BREAK: 'Break',
};

/**
 * The full session-detail view (same content as SessionDetailPage),
 * shown as a right-edge SlideOver from a card click instead of a route
 * change -- /sessions/:id still works standalone for direct links.
 */
export function SessionDetailOverlay({ session, onClose }: { session: Session | null; onClose: () => void }) {
  const { items: sessions } = useSessions();
  const { items: agenda } = useAgenda();
  const { items: venues } = useVenues();
  const { isSaved, toggleSession } = useSavedSessions();
  const { addToast } = useToast();

  const slot = session ? agenda.find((a) => a.sessionId === session.id) : undefined;
  const venue = slot?.venueId ? venues.find((v) => v.id === slot.venueId) : undefined;
  const related = session
    ? sessions.filter((s) => s.id !== session.id && s.track && s.track === session.track).slice(0, 3)
    : [];
  const saved = session ? isSaved(session.id) : false;

  const handleSaveToggle = () => {
    if (!session) return;
    toggleSession(session.id);
    addToast(saved ? 'Removed from saved sessions' : 'Added to your saved sessions', saved ? 'info' : 'success');
  };

  return (
    <SlideOver open={session !== null} onClose={onClose} title={session?.title}>
      {session && (
        <article className="c" style={{ gap: '20px' }}>
          <div className="r" style={{ gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="chip on">{TYPE_LABELS[session.sessionType] ?? session.sessionType}</span>
            {session.track && <span className="chip">{session.track}</span>}
          </div>

          <h1 className="d1" style={{ fontSize: '26px', margin: 0 }}>
            {session.title}
          </h1>

          <p className="mo" style={{ color: 'var(--muted)', fontSize: '13px' }}>
            {slot ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : 'Time TBA'}
            {session.durationMinutes ? ` · ${session.durationMinutes} min` : ''}
            {venue ? ` · ${venue.name}` : ' · Room TBA'}
          </p>

          {session.speakers && session.speakers.length > 0 && (
            <div className="kd" style={{ background: 'var(--surface-muted)', padding: '12px' }}>
              <p className="mo" style={{ fontSize: '11px', marginBottom: '8px' }}>Speaker</p>
              <div className="c" style={{ gap: '8px' }}>
                {session.speakers.map((sp) => (
                  <div key={sp.id} className="r" style={{ alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '999px',
                        background: 'var(--primary)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      {sp.name.charAt(0)}
                    </div>
                    <div className="c" style={{ gap: '2px' }}>
                      <Link to={`/speakers/${sp.id}`} className="lbl" style={{ textDecoration: 'none', color: 'var(--foreground)' }} onClick={onClose}>
                        {sp.name}
                      </Link>
                      {(sp.designation || sp.organization) && (
                        <p className="mo" style={{ fontSize: '11px', color: 'var(--muted)' }}>
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
              <p className="mo" style={{ fontSize: '11px', color: 'var(--muted)' }}>About this session</p>
              <p className="tx" style={{ fontSize: '14px', lineHeight: 1.6 }}>{session.description}</p>
            </div>
          )}

          <div className="kd" style={{ background: 'var(--surface)', gap: '4px' }}>
            <p className="mo" style={{ fontSize: '11px' }}>Prerequisites &amp; what to bring</p>
            <p className="tx">A laptop with WiFi and browser access. No prior cloud experience required.</p>
          </div>

          <div className="r" style={{ gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSaveToggle}
              className={`btn ${saved ? 'o' : ''}`}
              style={{ minHeight: '44px', padding: '0 20px', cursor: 'pointer' }}
              aria-pressed={saved}
            >
              {saved ? '✓ In my sessions' : 'Add to my sessions'}
            </button>
            <Link
              to={`/sessions/${session.id}`}
              className="btn g"
              style={{ minHeight: '44px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              onClick={onClose}
            >
              Open full page →
            </Link>
          </div>

          {related.length > 0 && (
            <div className="k mut" style={{ padding: '16px', gap: '10px', marginTop: '4px' }}>
              <p className="mo" style={{ color: 'var(--muted)' }}>Related sessions in {session.track}</p>
              <div className="c" style={{ gap: '8px' }}>
                {related.map((s) => (
                  <div key={s.id} className="kd" style={{ background: 'var(--surface)' }}>
                    <Link to={`/sessions/${s.id}`} className="lbl" style={{ textDecoration: 'none', color: 'var(--foreground)' }} onClick={onClose}>
                      {s.title} →
                    </Link>
                    <p className="mo" style={{ fontSize: '11px', color: 'var(--muted)' }}>
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
    </SlideOver>
  );
}
