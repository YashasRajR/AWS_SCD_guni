import { useMemo } from 'react';
import { useTimeline } from '../../lib/queries.js';
import { TimelineItem } from './TimelineItem.js';
import { SkeletonText } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

interface EventTimelineProps {
  limit?: number;
}

/**
 * Vertical rail on mobile; the same markup switches to a horizontal rail
 * from 1024px up via .timeline-list-desktop in index.css — no separate
 * desktop component needed.
 */
export function EventTimeline({ limit }: EventTimelineProps) {
  const { items, loading, error, reload } = useTimeline();

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [items],
  );
  const shown = limit ? sorted.slice(0, limit) : sorted;

  if (loading) return <SkeletonText lines={4} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (items.length === 0) return <EmptyState message="The day's flow will be published soon." />;

  return (
    <ol className="timeline-list timeline-list-desktop">
      {shown.map((item) => (
        <TimelineItem key={item.id} item={item} />
      ))}
    </ol>
  );
}
