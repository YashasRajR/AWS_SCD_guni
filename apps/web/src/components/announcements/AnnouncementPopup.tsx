import { useEffect, useState } from 'react';
import { useAnnouncements } from '../../lib/queries.js';
import { useAuth } from '../../lib/auth.js';
import { filterByAudience } from '../../lib/announcement-audience.js';

const STORAGE_KEY = 'scd_dismissed_popups';

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function persistDismissed(id: string): void {
  try {
    const current = readDismissed();
    if (!current.includes(id)) localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, id]));
  } catch {
    // Storage unavailable (private mode, disabled) — the popup just
    // reappears next visit, which is a harmless fallback.
  }
}

/**
 * Modal popup for announcements with showAsPopup set (spec section 40).
 * displayFrequency governs whether a dismissal sticks:
 *   - ONCE / UNTIL_DISMISSED: dismissing persists to localStorage, so it
 *     never shows again on this device.
 *   - EVERY_VISIT: dismissing only hides it for the rest of this page
 *     load (component state only) -- it reappears on the next visit.
 */
export function AnnouncementPopup() {
  const { items } = useAnnouncements();
  const { status } = useAuth();
  const [sessionDismissedId, setSessionDismissedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    setDismissedIds(readDismissed());
  }, []);

  const announcement = filterByAudience(items, status).find((a) => a.showAsPopup);

  if (
    !announcement ||
    announcement.id === sessionDismissedId ||
    (announcement.displayFrequency !== 'EVERY_VISIT' && dismissedIds.includes(announcement.id))
  ) {
    return null;
  }

  const dismiss = () => {
    if (announcement.displayFrequency === 'EVERY_VISIT') {
      setSessionDismissedId(announcement.id);
    } else {
      persistDismissed(announcement.id);
      setDismissedIds((prev) => [...prev, announcement.id]);
    }
  };

  return (
    <div className="popup-overlay" role="dialog" aria-modal="true" aria-label={announcement.title} onClick={dismiss}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="popup-close" aria-label="Close" onClick={dismiss}>
          ×
        </button>
        {announcement.imageUrl && <img src={announcement.imageUrl} alt="" className="popup-image" />}
        <h2>{announcement.title}</h2>
        <p>{announcement.message}</p>
        {announcement.buttonUrl && (
          <a href={announcement.buttonUrl} className="btn btn-primary" onClick={dismiss}>
            {announcement.buttonLabel || 'Learn more'}
          </a>
        )}
      </div>
    </div>
  );
}
