import type { TimelineItem } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { formatTime } from '../lib/format.js';

const TYPE_LABELS: Record<string, string> = {
  REGISTRATION: 'Registration',
  MEAL: 'Meal',
  SESSION: 'Session',
  BREAK: 'Break',
  NETWORKING: 'Networking',
  CLOSING: 'Closing',
  OTHER: 'Other',
};

export function TimelinePage() {
  const { items, loading, error } = useResource<TimelineItem>('/timeline');
  const sorted = [...items].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>Day flow</h1>
        <p className="page-section-lede">A quick, high-level look at how the day unfolds.</p>
      </header>

      {loading && <p className="status-line">Loading…</p>}
      {error && <p className="status-line status-error">{error}</p>}
      {!loading && !error && sorted.length === 0 && (
        <p className="status-line">The day&apos;s flow will be published soon.</p>
      )}

      <ol className="timeline-list">
        {sorted.map((item) => (
          <li key={item.id} className="timeline-item">
            <div className="timeline-item-marker" />
            <div className="timeline-item-body">
              <div className="timeline-item-head">
                <span className="timeline-item-time">
                  {formatTime(item.startTime)}
                  {item.endTime ? ` – ${formatTime(item.endTime)}` : ''}
                </span>
                <span className="badge badge-blue">{TYPE_LABELS[item.type] ?? item.type}</span>
              </div>
              <strong>{item.title}</strong>
              {item.description && <p>{item.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
