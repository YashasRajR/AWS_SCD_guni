import type { PastEvent } from '@scd/types';
import { formatDate } from '../../lib/format.js';
import { ExternalLinkIcon } from '../ui/Icon.js';

export function PastEventCard({ event }: { event: PastEvent }) {
  return (
    <div className="past-event-card">
      {event.sessionImage && <img src={event.sessionImage} alt="" className="past-event-image" loading="lazy" />}
      <div className="past-event-body">
        <span className="past-event-year">{event.year}</span>
        <h3>{event.eventName}</h3>
        {event.sessionName && <p className="past-event-session">{event.sessionName}</p>}
        {event.shortDescription && <p className="past-event-description">{event.shortDescription}</p>}
        <dl className="past-event-facts">
          {event.eventDate && (
            <div>
              <dt>Date</dt>
              <dd>{formatDate(event.eventDate)}</dd>
            </div>
          )}
          {event.location && (
            <div>
              <dt>Location</dt>
              <dd>{event.location}</dd>
            </div>
          )}
        </dl>
        {event.archiveUrl && (
          <a href={event.archiveUrl} target="_blank" rel="noreferrer">
            View recap <ExternalLinkIcon width={12} height={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </a>
        )}
      </div>
    </div>
  );
}
