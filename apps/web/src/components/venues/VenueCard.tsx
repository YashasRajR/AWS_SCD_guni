import type { Venue } from '@scd/types';
import { VenueMap } from './VenueMap.js';

export function VenueCard({ venue }: { venue: Venue }) {
  return (
    <div className="venue-card">
      <h3>{venue.name}</h3>
      {venue.room && <p className="venue-room">{venue.room}</p>}
      {venue.description && <p className="venue-description">{venue.description}</p>}
      <dl className="venue-facts">
        {venue.location && (
          <div>
            <dt>Location</dt>
            <dd>{venue.location}</dd>
          </div>
        )}
        {venue.capacity !== null && (
          <div>
            <dt>Capacity</dt>
            <dd>{venue.capacity}</dd>
          </div>
        )}
      </dl>
      {venue.mapUrl && <VenueMap mapUrl={venue.mapUrl} />}
    </div>
  );
}
