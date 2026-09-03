import { useMemo, useState } from 'react';
import { useSessions } from '../../lib/queries.js';
import { SessionCard } from './SessionCard.js';
import { SessionFilters } from './SessionFilters.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

interface SessionGridProps {
  limit?: number;
  /** Show the type filter chips (only makes sense on the dedicated Sessions page). */
  filterable?: boolean;
}

export function SessionGrid({ limit, filterable }: SessionGridProps) {
  const { items: sessions, loading, error, reload } = useSessions();
  const [activeType, setActiveType] = useState('ALL');

  const typeOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const s of sessions) seen.add(s.sessionType);
    return ['ALL', ...Array.from(seen)];
  }, [sessions]);

  if (loading) return <SkeletonGrid count={limit ?? 3} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (sessions.length === 0) return <EmptyState message="The session list will be published soon." />;

  const filtered = activeType === 'ALL' ? sessions : sessions.filter((s) => s.sessionType === activeType);
  const shown = limit ? filtered.slice(0, limit) : filtered;

  return (
    <div>
      {filterable && <SessionFilters options={typeOptions} active={activeType} onChange={setActiveType} />}
      {shown.length === 0 ? (
        <EmptyState message="No sessions match this filter yet." />
      ) : (
        <div className="session-list">
          {shown.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
