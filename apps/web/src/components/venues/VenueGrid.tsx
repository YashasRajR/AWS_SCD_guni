import type { Venue } from '@scd/types';
import { useVenues } from '../../lib/queries.js';
import { VenueCard } from './VenueCard.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

export const FALLBACK_VENUES: Venue[] = [
  {
    id: 'fallback-venue-coe',
    eventId: 'default',
    name: 'Centre of Excellence (CoE)',
    description: 'Main keynote hall equipped with high-density AV setups, livestream broadcast facilities, and keynote staging.',
    location: 'Ganpat Vidyanagar, Mehsana - Gozaria Highway, Gujarat 384012',
    room: 'Auditorium Ground Floor',
    capacity: 450,
    mapUrl: 'https://maps.google.com/maps?q=Ganpat+University+Mehsana',
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-venue-hall-209',
    eventId: 'default',
    name: 'Seminar Hall 209',
    description: 'Dedicated technical breakout and hands-on workshop hall for builder sessions, demos, and lightning talks.',
    location: '2nd Floor, New Building, Ganpat University',
    room: 'Hall 209',
    capacity: 220,
    mapUrl: 'https://maps.google.com/maps?q=Ganpat+University+Mehsana',
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export function VenueGrid({ limit }: { limit?: number }) {
  const { items: venues, loading, error, reload } = useVenues();

  if (loading && (!venues || venues.length === 0)) return <SkeletonGrid count={limit ?? 2} />;

  const items = venues && venues.length > 0 ? venues : FALLBACK_VENUES;
  if (error && items.length === 0) return <ErrorState onRetry={reload} />;
  if (items.length === 0) return <EmptyState message="Venue details will be published soon." />;

  const shown = limit ? items.slice(0, limit) : items;

  return (
    <div className="card-grid card-grid-2">
      {shown.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}

