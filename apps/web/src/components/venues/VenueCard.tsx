import type { Venue } from '@scd/types';
import { useToast } from '../../lib/toast.js';

export function VenueCard({ venue }: { venue: Venue }) {
  const { addToast } = useToast();

  const copyAddress = () => {
    if (!venue.location) return;
    void navigator.clipboard.writeText(venue.location).then(() => {
      addToast(`Address copied: ${venue.name}`, 'success');
    });
  };

  return (
    <div className="venue-card k" data-reveal style={{ padding: '16px', gap: '10px', background: 'var(--scd-surface)' }}>
      <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 className="d3" style={{ margin: 0 }}>{venue.name}</h3>
        {venue.capacity !== null && (
          <span className="chip" style={{ fontSize: '10px' }}>
            Capacity: {venue.capacity}
          </span>
        )}
      </div>

      {venue.room && (
        <p className="venue-room mo" style={{ color: 'var(--scd-muted)', fontSize: '12px' }}>
          Room: {venue.room}
        </p>
      )}

      {venue.description && <p className="venue-description tx" style={{ fontSize: '12px' }}>{venue.description}</p>}

      {venue.location && (
        <div className="kd" style={{ background: 'var(--scd-surface-muted)', padding: '8px' }}>
          <p className="mo" style={{ fontSize: '10px', color: 'var(--scd-muted)' }}>Location</p>
          <p className="tx" style={{ fontSize: '12px' }}>{venue.location}</p>
        </div>
      )}

      <div className="venue-actions r" style={{ gap: '8px', marginTop: 'auto' }}>
        {venue.location && (
          <button type="button" className="btn g" onClick={copyAddress} style={{ fontSize: '11px', cursor: 'pointer' }}>
            Copy address
          </button>
        )}
        {venue.mapUrl && (
          <a
            href={venue.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="btn o"
            style={{ fontSize: '11px', textDecoration: 'none' }}
          >
            Open map
          </a>
        )}
      </div>
    </div>
  );
}
