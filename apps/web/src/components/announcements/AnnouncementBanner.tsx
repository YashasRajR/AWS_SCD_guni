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
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const announcement = filterByAudience(items, status).find((a) => !a.showAsPopup);
  if (!announcement || announcement.id === dismissedId) return null;

  const toneClass =
    announcement.priority === 'URGENT'
      ? 'announcement-banner-urgent'
      : announcement.priority === 'HIGH'
        ? 'announcement-banner-high'
        : '';

  return (
    <div className={`announcement-banner ${toneClass}`.trim()} role="status">
      <div className="announcement-banner-inner">
        <MegaphoneIcon width={18} height={18} />
        <span>
          <strong>{announcement.title}:</strong> {announcement.message}
        </span>
        <button
          type="button"
          className="btn-link"
          style={{ marginLeft: 'auto', flexShrink: 0 }}
          onClick={() => setDismissedId(announcement.id)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
