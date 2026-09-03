import { MapPinIcon } from '../ui/Icon.js';

/** "Open in Maps" link — a plain external link, not an embedded map (no venue coordinates are exposed). */
export function VenueMap({ mapUrl }: { mapUrl: string }) {
  return (
    <a href={mapUrl} target="_blank" rel="noreferrer" className="btn-link">
      <MapPinIcon width={14} height={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
      Open in Maps
    </a>
  );
}
