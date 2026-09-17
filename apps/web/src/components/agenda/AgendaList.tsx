import { useMemo, useState } from 'react';
import { useAgenda, useSessions, useVenues } from '../../lib/queries.js';
import { formatTime } from '../../lib/format.js';
import { AgendaItem } from './AgendaItem.js';
import { SkeletonText } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

interface AgendaListProps {
  limit?: number;
}

export function AgendaList({ limit }: AgendaListProps) {
  const { items: agenda, loading, error, reload } = useAgenda();
  const { items: sessions } = useSessions();
  const { items: venues } = useVenues();
  const [activeTrack, setActiveTrack] = useState<string>('ALL');

  const sessionsById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);
  const venuesById = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);

  // Extract distinct tracks from sessions/venues
  const trackOptions = useMemo(() => {
    const tracks = new Set<string>();
    for (const s of sessions) {
      if (s.track) tracks.add(s.track);
    }
    for (const v of venues) {
      if (v.name) tracks.add(v.name);
    }
    // Standard wireframe tracks if not already present
    return ['ALL', ...Array.from(tracks)];
  }, [sessions, venues]);

  const sorted = useMemo(
    () => [...agenda].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [agenda],
  );

  const filtered = useMemo(() => {
    if (activeTrack === 'ALL') return sorted;
    return sorted.filter((item) => {
      const session = item.sessionId ? sessionsById.get(item.sessionId) : undefined;
      const venue = item.venueId ? venuesById.get(item.venueId) : undefined;
      const matchesSessionTrack = session?.track?.toLowerCase() === activeTrack.toLowerCase();
      const matchesVenue = venue?.name?.toLowerCase().includes(activeTrack.toLowerCase());
      // Always show breaks across all tracks
      const isBreak =
        session?.sessionType === 'BREAK' ||
        item.title.toLowerCase().includes('break') ||
        item.title.toLowerCase().includes('lunch');
      return isBreak || matchesSessionTrack || matchesVenue;
    });
  }, [sorted, activeTrack, sessionsById, venuesById]);

  const limited = limit ? filtered.slice(0, limit) : filtered;

  // Group by start time for matrix/timeline layout
  const timeSlots = useMemo(() => {
    const slots = new Map<string, typeof limited>();
    for (const item of limited) {
      const timeKey = formatTime(item.startTime);
      const existing = slots.get(timeKey) ?? [];
      existing.push(item);
      slots.set(timeKey, existing);
    }
    return slots;
  }, [limited]);

  if (loading) return <SkeletonText lines={6} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (agenda.length === 0) return <EmptyState message="The agenda will be published soon." />;

  return (
    <div className="c" style={{ gap: '20px' }}>
      {/* Track filters */}
      <div className="r" style={{ flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {trackOptions.map((trk) => {
          const isSelected = activeTrack === trk;
          return (
            <button
              key={trk}
              type="button"
              className={`chip ${isSelected ? 'on' : ''}`}
              aria-pressed={isSelected}
              onClick={() => setActiveTrack(trk)}
              style={{
                cursor: 'pointer',
                fontFamily: 'var(--scd-mono)',
                fontSize: '11px',
                padding: '6px 12px',
                borderRadius: '999px',
                border: '1px solid var(--scd-fg)',
                background: isSelected ? 'var(--scd-accent)' : 'var(--scd-surface)',
                color: 'var(--scd-fg)',
              }}
            >
              {trk === 'ALL' ? 'All tracks' : trk}
            </button>
          );
        })}
      </div>

      {/* Agenda list / Time blocks */}
      <div className="c" style={{ gap: '12px' }}>
        {[...timeSlots.entries()].map(([time, items]) => {
          const now = Date.now();
          const hasLiveItem = items.some(
            (i) => now >= new Date(i.startTime).getTime() && now < new Date(i.endTime).getTime(),
          );

          return (
            <div key={time} className="c" style={{ gap: '8px' }}>
              <div
                className="k mut"
                style={{
                  padding: '6px 10px',
                  position: 'sticky',
                  top: '72px',
                  zIndex: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span className="mo" style={{ fontWeight: 700, color: hasLiveItem ? '#B36200' : 'var(--scd-fg)' }}>
                  {time} {hasLiveItem ? '· now ●' : ''}
                </span>
                <span className="mo" style={{ fontSize: '10px', color: 'var(--scd-muted)' }}>
                  {items.length} event{items.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="c" style={{ gap: '6px' }}>
                {items.map((item) => (
                  <AgendaItem
                    key={item.id}
                    item={item}
                    session={item.sessionId ? sessionsById.get(item.sessionId) : undefined}
                    venue={item.venueId ? venuesById.get(item.venueId) : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
