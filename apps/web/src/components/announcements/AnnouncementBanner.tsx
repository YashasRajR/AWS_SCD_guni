import { useState } from 'react';
import { useAnnouncements } from '../../lib/queries.js';
import { useAuth } from '../../lib/auth.js';
import { filterByAudience } from '../../lib/announcement-audience.js';
import { MegaphoneIcon } from '../ui/Icon.js';

/**
 * Site-wide banner for the single most important active announcement.
 * /announcements already returns only PUBLISHED, currently-in-window
 * announcements ordered by priority DESC (see backend announcements
 * repository) — so "most important active" is simply the first item
 * that also matches the viewer's audience and isn't popup-only (a
 * showAsPopup announcement renders as a modal instead — see
 * AnnouncementPopup — not also as a banner).
 * Dismissing hides it for the rest of this page load; it never persists a
 * dismissal past a reload, since the announcement is still genuinely active.
 */
export function AnnouncementBanner() {
  const { items } = useAnnouncements();
  const { status } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const announcement = filterByAudience(items, status).find((a) => !a.showAsPopup);

  if (dismissed || !announcement) return null;

  return (
    <aside
      className="container"
      style={{ paddingTop: '10px', paddingBottom: '0' }}
      aria-label="Registration announcement"
    >
      <div
        className="r kd"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          background: 'var(--surface)',
          borderColor: 'var(--border-dashed)',
        }}
        role="status"
      >
        <span className="mo" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          <strong>{announcement.title}:</strong> {announcement.message}
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px',
          }}
          className="mo"
          aria-label="Dismiss banner"
        >
          ✕ dismiss
        </button>
      </div>
    </aside>
  );
}
