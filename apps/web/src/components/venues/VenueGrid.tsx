import { useVenues } from '../../lib/queries.js';
import { VenueCard } from './VenueCard.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

export function VenueGrid({ limit }: { limit?: number }) {
  const { items: venues, loading, error, reload } = useVenues();

  if (loading && (!venues || venues.length === 0)) return <SkeletonGrid count={limit ?? 2} />;

  // No hardcoded fallback here: this list must reflect exactly what's
  // published in Admin -> Content -> Venues. A fallback that mirrors old
  // seed data would make an admin's delete/edit silently not show up on
  // the site whenever the real list happened to be empty.
  const items = venues ?? [];
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

