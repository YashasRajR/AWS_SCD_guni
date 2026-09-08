import { useState } from 'react';
import type { Venue } from '@scd/types';
import { VenueMap } from './VenueMap.js';

export function VenueCard({ venue }: { venue: Venue }) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!venue.location) return;
    void navigator.clipboard.writeText(venue.location).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

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
      <div className="venue-actions">
        {venue.location && (
          <button type="button" className="btn-link" onClick={copyAddress}>
            {copied ? 'Copied!' : 'Copy address'}
          </button>
        )}
        {venue.mapUrl && <VenueMap mapUrl={venue.mapUrl} />}
      </div>
    </div>
  );
}
