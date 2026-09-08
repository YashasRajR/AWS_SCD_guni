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
  const [search, setSearch] = useState('');

  const typeOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const s of sessions) seen.add(s.sessionType);
    return ['ALL', ...Array.from(seen)];
  }, [sessions]);

  const trackCount = useMemo(() => new Set(sessions.map((s) => s.track).filter(Boolean)).size, [sessions]);

  if (loading) return <SkeletonGrid count={limit ?? 3} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (sessions.length === 0) return <EmptyState message="The session list will be published soon." />;

  const byType = activeType === 'ALL' ? sessions : sessions.filter((s) => s.sessionType === activeType);
  const query = search.trim().toLowerCase();
  const filtered = query ? byType.filter((s) => s.title.toLowerCase().includes(query)) : byType;
  const shown = limit ? filtered.slice(0, limit) : filtered;
  const filtersActive = activeType !== 'ALL' || query.length > 0;

  const clearFilters = () => {
    setActiveType('ALL');
    setSearch('');
  };

  return (
    <div>
      {filterable && (
        <div className="session-filter-bar">
          <SessionFilters options={typeOptions} active={activeType} onChange={setActiveType} />
          <div className="session-filter-row">
            <input
              type="search"
              className="session-search"
              placeholder="Search sessions"
              aria-label="Search sessions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {filtersActive && (
              <button type="button" className="btn-link" onClick={clearFilters}>
                Clear all
              </button>
            )}
          </div>
          <p className="session-count">
            {filtered.length} session{filtered.length === 1 ? '' : 's'}
            {trackCount > 0 ? ` · ${trackCount} track${trackCount === 1 ? '' : 's'}` : ''}
          </p>
        </div>
      )}
      {shown.length === 0 ? (
        <EmptyState
          message="No sessions match this filter yet."
          action={
            filtersActive ? (
              <button type="button" className="btn-link" onClick={clearFilters}>
                Clear all filters
              </button>
            ) : undefined
          }
        />
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
