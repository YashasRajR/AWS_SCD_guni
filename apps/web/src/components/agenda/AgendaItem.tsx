import type { Session, Venue } from '@scd/types';
import type { AgendaItem as AgendaItemType } from '@scd/types';
import { formatTime } from '../../lib/format.js';

interface AgendaItemProps {
  item: AgendaItemType;
  session?: Session;
  venue?: Venue;
}

export function AgendaItem({ item, session, venue }: AgendaItemProps) {
  return (
    <li className="agenda-item">
      <div className="agenda-item-time">
        {formatTime(item.startTime)} – {formatTime(item.endTime)}
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
