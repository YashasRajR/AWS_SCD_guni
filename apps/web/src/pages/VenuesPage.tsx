import type { Venue } from '@scd/types';
import { useResource } from '../lib/hooks.js';

export function VenuesPage() {
  const { items: venues, loading, error } = useResource<Venue>('/venues');

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>Venues</h1>
        <p className="page-section-lede">Where to find each room and space on the day.</p>
      </header>

      {loading && <p className="status-line">Loading venues…</p>}
      {error && <p className="status-line status-error">{error}</p>}
      {!loading && !error && venues.length === 0 && (
        <p className="status-line">Venue details will be published soon.</p>
      )}

      <div className="card-grid">
        {venues.map((v) => (
          <div key={v.id} className="venue-card">
            <h3>{v.name}</h3>
            {v.room && <p className="venue-room">{v.room}</p>}
            {v.description && <p>{v.description}</p>}
            <dl className="venue-facts">
              {v.location && (
                <div>
                  <dt>Location</dt>
                  <dd>{v.location}</dd>
                </div>
              )}
              {v.capacity !== null && (
                <div>
                  <dt>Capacity</dt>
                  <dd>{v.capacity}</dd>
                </div>
              )}
            </dl>
            {v.mapUrl && (
              <a href={v.mapUrl} target="_blank" rel="noreferrer" className="btn-link">
                View on map →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
