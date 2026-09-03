import { useMemo } from 'react';
import { useAgenda, useSessions, useVenues } from '../../lib/queries.js';
import { groupByDay } from '../../lib/format.js';
import { AgendaItem } from './AgendaItem.js';
import { SkeletonText } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

interface AgendaListProps {
  limit?: number;
}

/**
 * Mobile-first vertical list, grouped by calendar day. Sessions/venues are
 * fetched alongside the agenda and joined client-side by id (the public
 * /agenda endpoint intentionally returns bare items — see backend comment
 * in agenda.service.ts) so each row can show who's speaking and where.
 */
export function AgendaList({ limit }: AgendaListProps) {
  const { items: agenda, loading, error, reload } = useAgenda();
  const { items: sessions } = useSessions();
  const { items: venues } = useVenues();

  const sessionsById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);
  const venuesById = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);

  const sorted = useMemo(
    () => [...agenda].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [agenda],
  );
  const limited = limit ? sorted.slice(0, limit) : sorted;
  const grouped = useMemo(() => groupByDay(limited, (item) => item.startTime), [limited]);

  if (loading) return <SkeletonText lines={5} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (agenda.length === 0) return <EmptyState message="The agenda will be published soon." />;

  return (
    <div>
      {[...grouped.entries()].map(([day, items]) => (
        <div key={day} className="agenda-day">
          {grouped.size > 1 && <h3 className="agenda-day-title">{day}</h3>}
          <ol className="agenda-list">
            {items.map((item) => (
              <AgendaItem
                key={item.id}
                item={item}
                session={item.sessionId ? sessionsById.get(item.sessionId) : undefined}
                venue={item.venueId ? venuesById.get(item.venueId) : undefined}
              />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
