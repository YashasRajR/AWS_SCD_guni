import type { TimelineItem as TimelineItemType } from '@scd/types';
import { formatTime } from '../../lib/format.js';

const TYPE_LABELS: Record<string, string> = {
  REGISTRATION: 'Registration',
  MEAL: 'Meal',
  SESSION: 'Session',
  BREAK: 'Break',
  NETWORKING: 'Networking',
  CLOSING: 'Closing',
  OTHER: 'Other',
};

export function TimelineItem({ item }: { item: TimelineItemType }) {
  return (
    <li className="timeline-item" data-reveal>
      <span className="timeline-item-marker" aria-hidden="true" />
      <div className="timeline-item-body">
        <div className="timeline-item-head">
          <span className="timeline-item-time">
            {formatTime(item.startTime)}
            {item.endTime ? ` – ${formatTime(item.endTime)}` : ''}
          </span>
          <span className="badge badge-info">{TYPE_LABELS[item.type] ?? item.type}</span>
        </div>
        <strong>{item.title}</strong>
        {item.description && <p>{item.description}</p>}
      </div>
    </li>
  );
}
