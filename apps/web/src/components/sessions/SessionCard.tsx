import type { MouseEvent } from 'react';
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

export function SessionCard({ session, onOpen }: { session: Session; onOpen: () => void }) {
  const { isSaved, toggleSession } = useSavedSessions();
  const { addToast } = useToast();
  const saved = isSaved(session.id);

  const handleSaveToggle = (e: MouseEvent) => {
    e.stopPropagation();
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
    <article
      className="k session-card card-clickable"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
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
          onClick={handleSaveToggle}
          className={`btn ${saved ? 'o' : ''}`}
          style={{ padding: '6px 10px', fontSize: '11px', minHeight: 'auto' }}
          aria-pressed={saved}
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </article>
  );
}
