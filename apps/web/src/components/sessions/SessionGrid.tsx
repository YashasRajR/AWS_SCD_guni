import { useMemo, useRef, useState } from 'react';
import { useSessions } from '../../lib/queries.js';
import { SessionCard } from './SessionCard.js';
import { SessionFilters } from './SessionFilters.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';
import { useFlip } from '../../lib/useFlip.js';

interface SessionGridProps {
  limit?: number;
  /** Show the type filter chips (only makes sense on the dedicated Sessions page). */
  filterable?: boolean;
}

export function SessionGrid({ limit, filterable }: SessionGridProps) {
  const { items: sessions, loading, error, reload } = useSessions();
  const [activeType, setActiveType] = useState('ALL');
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const typeOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const s of sessions) seen.add(s.sessionType);
    return ['ALL', ...Array.from(seen)];
  }, [sessions]);

  const trackCount = useMemo(() => new Set(sessions.map((s) => s.track).filter(Boolean)).size, [sessions]);

  const byType = activeType === 'ALL' ? sessions : sessions.filter((s) => s.sessionType === activeType);
  const query = search.trim().toLowerCase();
  const filtered = query ? byType.filter((s) => s.title.toLowerCase().includes(query)) : byType;
  const shown = limit ? filtered.slice(0, limit) : filtered;
  const filtersActive = activeType !== 'ALL' || query.length > 0;

  // Wireframe 1b: "Filter change = FLIP reposition + fade, never a hard
  // swap." Runs even while loading/empty (empty deps list is harmless).
  useFlip(
    listRef,
    shown.map((s) => s.id),
  );

  if (loading) return <SkeletonGrid count={limit ?? 3} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (sessions.length === 0) return <EmptyState message="The session list will be published soon." />;

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
          <p className="session-count" aria-live="polite">
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
        <div className="session-list" ref={listRef}>
          {shown.map((session) => (
            <div key={session.id} data-flip-id={session.id}>
              <SessionCard session={session} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
