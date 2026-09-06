import { usePastEvents } from '../../lib/queries.js';
import { PastEventCard } from './PastEventCard.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

export function PastEventGrid() {
  const { items, loading, error, reload } = usePastEvents();

  if (loading) return <SkeletonGrid count={3} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (items.length === 0) return <EmptyState message="This is the first edition — check back after the event!" />;

  return (
    <div className="card-grid card-grid-3">
      {items.map((event) => (
        <PastEventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
