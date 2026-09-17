import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AgendaItem as AgendaItemType, Session, Venue } from '@scd/types';
import { formatTime } from '../../lib/format.js';
import { useSavedSessions } from '../../lib/useSavedSessions.js';
import { useToast } from '../../lib/toast.js';

interface AgendaItemProps {
  item: AgendaItemType;
  session?: Session;
  venue?: Venue;
  compact?: boolean;
}

export function AgendaItem({ item, session, venue, compact = false }: AgendaItemProps) {
  const [expanded, setExpanded] = useState(false);
  const { isSaved, toggleSession } = useSavedSessions();
  const { addToast } = useToast();

  const isBreak =
    session?.sessionType === 'BREAK' ||
    item.title.toLowerCase().includes('break') ||
    item.title.toLowerCase().includes('lunch') ||
    item.title.toLowerCase().includes('tea');

  const now = Date.now();
  const isNow = now >= new Date(item.startTime).getTime() && now < new Date(item.endTime).getTime();

  if (isBreak) {
    return (
      <div
        className="r agenda-break-divider"
        style={{
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          width: '100%',
        }}
      >
        <span className="mo" style={{ width: '50px', color: 'var(--scd-muted)' }}>
          {formatTime(item.startTime)}
        </span>
        <hr className="rule" style={{ flex: 1, height: '2px', background: 'var(--scd-accent)', border: 0 }} />
        <span className="mo" style={{ color: 'var(--scd-accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {item.title}
        </span>
        <hr className="rule" style={{ flex: 1, height: '2px', background: 'var(--scd-accent)', border: 0 }} />
      </div>
    );
  }

  const saved = session ? isSaved(session.id) : false;

  const handleToggle = () => {
    if (!session) return;
    toggleSession(session.id);
    if (!saved) {
      addToast('Added to your saved sessions', 'success');
    } else {
      addToast('Removed from saved sessions', 'info');
    }
  };

  const speakers = session?.speakers && session.speakers.length > 0
    ? session.speakers.map((s) => s.name).join(', ')
    : null;

  return (
    <div
      className={`k ${isNow ? 'agenda-row-now' : ''}`}
      style={{
        padding: '10px 12px',
        borderTop: isNow ? '2.5px solid var(--scd-accent)' : undefined,
        background: isNow ? 'rgba(255, 153, 0, 0.04)' : 'var(--scd-surface)',
        transition: 'all 0.15s ease',
      }}
    >
      <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div className="c" style={{ gap: '4px', flex: 1 }}>
          <div className="r" style={{ alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span className="lbl" style={{ fontSize: compact ? '13px' : '14px', color: 'var(--scd-fg)' }}>
              {item.title}
            </span>
            {isNow && (
              <span className="mo" style={{ color: '#B36200', fontWeight: 700 }}>
                Happening now ●
              </span>
            )}
          </div>
          <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>
            {formatTime(item.startTime)} – {formatTime(item.endTime)}
            {venue ? ` · ${venue.name}` : ''}
            {session?.track ? ` · ${session.track}` : ''}
          </p>
          {speakers && (
            <p className="mo" style={{ color: 'var(--scd-fg)', fontSize: '11px' }}>
              {speakers}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="lbl"
          style={{
            background: 'transparent',
            border: '1px solid var(--scd-border)',
            borderRadius: '4px',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '15px',
            color: 'var(--scd-primary)',
          }}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      {expanded && (
        <div className="kd" style={{ marginTop: '8px', background: 'var(--scd-surface-muted)', gap: '6px' }}>
          {session?.description && (
            <p className="tx" style={{ fontSize: '12px' }}>
              {session.description}
            </p>
          )}
          <div className="r" style={{ gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
            {session && (
              <Link to={`/sessions/${session.id}`} className="btn g" style={{ fontSize: '10px', padding: '4px 8px', textDecoration: 'none' }}>
                Open full page →
              </Link>
            )}
            {session && (
              <button
                type="button"
                onClick={handleToggle}
                className={`btn ${saved ? 'o' : 'g'}`}
                style={{ fontSize: '10px', padding: '4px 8px', cursor: 'pointer' }}
                aria-pressed={saved}
              >
                {saved ? '✓ In my sessions' : 'Add to my sessions'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
