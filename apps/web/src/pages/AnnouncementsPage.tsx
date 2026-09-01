import type { Announcement } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';

export function AnnouncementsPage() {
  const { items: announcements, loading, error } = useResource<Announcement>('/announcements');

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>Announcements</h1>
        <p className="page-section-lede">The latest updates from the organizing team.</p>
      </header>

      {loading && <p className="status-line">Loading announcements…</p>}
      {error && <p className="status-line status-error">{error}</p>}
      {!loading && !error && announcements.length === 0 && (
        <p className="status-line">No announcements right now — check back later.</p>
      )}

      <div className="announcement-list">
        {announcements.map((a) => (
          <article key={a.id} className={`announcement-card announcement-${a.priority.toLowerCase()}`}>
            <div className="announcement-head">
              <strong>{a.title}</strong>
              <span className="announcement-priority">{a.priority}</span>
            </div>
            <p>{a.message}</p>
            {a.publishAt && <p className="announcement-meta">{formatDateTime(a.publishAt)}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
