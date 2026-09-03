import { useVenues } from '../../lib/queries.js';
import { VenueCard } from './VenueCard.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

export function VenueGrid({ limit }: { limit?: number }) {
  const { items: venues, loading, error, reload } = useVenues();

  if (loading) return <SkeletonGrid count={limit ?? 2} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (venues.length === 0) return <EmptyState message="Venue details will be published soon." />;

  const shown = limit ? venues.slice(0, limit) : venues;

  return (
    <div className="card-grid card-grid-2">
      {shown.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}
