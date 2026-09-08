import type { Session, Venue } from '@scd/types';
import type { AgendaItem as AgendaItemType } from '@scd/types';
import { formatTime } from '../../lib/format.js';

interface AgendaItemProps {
  item: AgendaItemType;
  session?: Session;
  venue?: Venue;
}

export function AgendaItem({ item, session, venue }: AgendaItemProps) {
  // Wireframe 1c callout: "Happening now = orange top rule + mono marker
  // on the live row" -- derived from the real start/end timestamps, not a
  // guess, and simply never true outside the actual event window.
  const now = Date.now();
  const isNow = now >= new Date(item.startTime).getTime() && now < new Date(item.endTime).getTime();

  return (
    <li className={isNow ? 'agenda-item agenda-item-now' : 'agenda-item'}>
      <div className="agenda-item-time">
        {formatTime(item.startTime)} – {formatTime(item.endTime)}
        {isNow && <span className="agenda-item-now-marker">Now</span>}
      </div>
      <div className="agenda-item-body">
        <span className="agenda-item-title">{item.title}</span>
        {session?.speakers && session.speakers.length > 0 && (
          <span className="agenda-item-meta">{session.speakers.map((sp) => sp.name).join(', ')}</span>
        )}
        {venue && <span className="agenda-item-meta">{venue.name}</span>}
      </div>
    </li>
  );
}
