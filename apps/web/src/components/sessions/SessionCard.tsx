import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Session } from '@scd/types';
import { useSavedSessions } from '../../lib/useSavedSessions.js';
import { useToast } from '../../lib/toast.js';

const TYPE_LABELS: Record<string, string> = {
  KEYNOTE: 'Keynote',
  TALK: 'Talk',
  WORKSHOP: 'Workshop',
  PANEL: 'Panel',
  BREAK: 'Break',
};

export function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false);
  const { isSaved, toggleSession } = useSavedSessions();
  const { addToast } = useToast();
  const saved = isSaved(session.id);

  const handleSaveToggle = () => {
    toggleSession(session.id);
    if (!saved) {
      addToast('Added to your saved sessions', 'success');
    } else {
      addToast('Removed from saved sessions', 'info');
    }
  };

  const typeLabel = TYPE_LABELS[session.sessionType] ?? session.sessionType;
  const speakerNames =
    session.speakers && session.speakers.length > 0
      ? session.speakers.map((sp) => sp.name).join(', ')
      : 'TBA';

  return (
    <article className={`k session-card ${expanded ? 'session-card-expanded' : ''}`} style={{ transition: 'all 0.2s ease' }}>
      <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="c" style={{ gap: '6px', flex: 1 }}>
          <div className="session-card-head r" style={{ gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-info chip on" style={{ padding: '2px 8px', fontSize: '11px' }}>
              {typeLabel}
            </span>
            {session.track && (
              <span className="badge badge-neutral chip" style={{ padding: '2px 8px', fontSize: '11px' }}>
                {session.track}
              </span>
            )}
            {session.durationMinutes && (
              <span className="session-duration mo" style={{ fontSize: '11px' }}>
                {session.durationMinutes} min
              </span>
            )}
          </div>
          <h3 className="lbl" style={{ fontSize: '16px', margin: '4px 0 2px' }}>
            {session.title}
          </h3>
          <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '12px' }}>
            {typeLabel}
            {session.durationMinutes ? ` · ${session.durationMinutes} min` : ''}
            {session.track ? ` · ${session.track}` : ''}
            {' · Room TBA'}
          </p>
          {session.description && <p className="tx session-description">{session.description}</p>}
          {session.speakers && session.speakers.length > 0 && (
            <p className="session-speakers mo" style={{ color: 'var(--scd-fg)', fontWeight: 600 }}>
              {speakerNames}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="lbl"
          style={{
            background: 'transparent',
            border: '1px solid var(--scd-border)',
            borderRadius: '4px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            color: 'var(--scd-primary)',
          }}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse session details' : 'Expand session details'}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      {expanded && (
        <div className="kd" style={{ marginTop: '10px', background: 'var(--scd-surface-muted)' }}>
          <div className="r" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div className="c" style={{ flex: '1 1 200px', gap: '6px' }}>
              <div>
                <p className="mo" style={{ fontSize: '11px' }}>Speaker</p>
                <p className="lbl">{speakerNames}</p>
              </div>
              <div>
                <p className="mo" style={{ fontSize: '11px' }}>Prerequisites</p>
                <p className="tx">A laptop with a modern web browser. Nothing else.</p>
              </div>
            </div>
            <div className="c" style={{ flex: '1 1 200px', gap: '8px', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
              <p className="mo" style={{ fontSize: '11px' }}>Detail expands in place</p>
              <div className="r" style={{ gap: '8px', flexWrap: 'wrap' }}>
                <Link to={`/sessions/${session.id}`} className="btn g btn-link" style={{ textDecoration: 'none' }}>
                  Open full page →
                </Link>
                <button
                  type="button"
                  onClick={handleSaveToggle}
                  className={`btn ${saved ? 'o' : ''}`}
                  aria-pressed={saved}
                >
                  {saved ? '✓ In my sessions' : 'Add to my sessions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
