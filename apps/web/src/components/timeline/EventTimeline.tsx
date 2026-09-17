import { useMemo, useState } from 'react';
import type { TimelineItem as TimelineItemType } from '@scd/types';
import { useTimeline } from '../../lib/queries.js';
import { formatTime } from '../../lib/format.js';
import { SkeletonText } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

interface EventTimelineProps {
  limit?: number;
}

const DEFAULT_STATIONS: Array<Partial<TimelineItemType>> = [
  { id: 'def-1', title: 'Registration & check-in', type: 'REGISTRATION', startTime: '2026-10-08T09:00:00+05:30', description: 'Volunteers verify registrations at the CoE entrance.' },
  { id: 'def-2', title: 'Opening ceremony', type: 'OTHER', startTime: '2026-10-08T10:00:00+05:30', description: 'Welcome address, university dignitaries, and day overview.' },
  { id: 'def-3', title: 'Keynote address', type: 'SESSION', startTime: '2026-10-08T11:00:00+05:30', description: 'Visionary cloud engineering keynote from AWS community leaders.' },
  { id: 'def-4', title: 'Technical breakout tracks', type: 'SESSION', startTime: '2026-10-08T12:00:00+05:30', description: 'Concurrent technical sessions across architecture and serverless.' },
  { id: 'def-5', title: 'Hands-on workshops', type: 'SESSION', startTime: '2026-10-08T14:00:00+05:30', description: 'Build live on AWS in guided interactive labs.' },
  { id: 'def-6', title: 'Community activity & quiz', type: 'OTHER', startTime: '2026-10-08T16:00:00+05:30', description: 'Cloud trivia, student lightning demos, and prizes.' },
  { id: 'def-7', title: 'Closing ceremony & awards', type: 'CLOSING', startTime: '2026-10-08T17:30:00+05:30', description: 'Certificates distribution, closing remarks, and high tea.' },
  { id: 'def-8', title: 'Networking & community mixer', type: 'NETWORKING', startTime: '2026-10-08T18:00:00+05:30', description: 'Connect with mentors, sponsors, and student peers.' },
];

export function EventTimeline({ limit }: EventTimelineProps) {
  const { items, loading, error, reload } = useTimeline();
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const stations = useMemo(() => {
    if (items && items.length > 0) {
      const sorted = [...items].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      // If fewer than 8, pad with default stations
      if (sorted.length < 8) {
        const remaining = DEFAULT_STATIONS.slice(sorted.length);
        return [...sorted, ...remaining] as TimelineItemType[];
      }
      return sorted;
    }
    return DEFAULT_STATIONS as TimelineItemType[];
  }, [items]);

  const activeStation = (selectedStationId ? stations.find((s) => s.id === selectedStationId) : null) ?? stations[0];

  if (loading) return <SkeletonText lines={6} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (stations.length === 0) return <EmptyState message="The day's flow will be published soon." />;

  const topRow = stations.slice(0, 4);
  const bottomRow = stations.slice(4, 8);

  return (
    <div className="c" style={{ gap: '28px' }}>
      {/* Desktop Asymmetric Spine View (hidden on small mobile) */}
      <div className="timeline-desktop-spine" style={{ display: 'none', position: 'relative', padding: '20px 0' }}>
        {/* Top 4 stations */}
        <div className="r" style={{ alignItems: 'flex-end', gap: '12px' }}>
          {topRow.map((item, idx) => {
            const isSelected = activeStation?.id === item.id;
            const isOffset = idx % 2 === 1;
            return (
              <div
                key={item.id || idx}
                onClick={() => setSelectedStationId(item.id)}
                className={`k ${isSelected ? 'timeline-selected' : ''}`}
                style={{
                  flex: 1,
                  cursor: 'pointer',
                  marginBottom: isOffset ? '24px' : '0px',
                  border: isSelected ? '2px solid var(--scd-accent)' : '1.25px solid var(--scd-border)',
                  background: isSelected ? 'var(--scd-surface)' : 'var(--scd-surface-muted)',
                  padding: '12px',
                  transition: 'all 0.2s ease',
                }}
              >
                <p className="mo" style={{ color: isSelected ? 'var(--scd-accent)' : 'var(--scd-muted)' }}>
                  {formatTime(item.startTime)}
                </p>
                <p className="lbl" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  {item.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Navy spine */}
        <div
          style={{
            height: '3px',
            background: 'var(--scd-primary)',
            margin: '14px 0',
            position: 'relative',
            borderRadius: '2px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '-4px',
              width: '10px',
              height: '10px',
              borderRadius: '999px',
              background: 'var(--scd-accent)',
            }}
          />
        </div>

        {/* Bottom 4 stations */}
        <div className="r" style={{ alignItems: 'flex-start', gap: '12px' }}>
          {bottomRow.map((item, idx) => {
            const isSelected = activeStation?.id === item.id;
            const isOffset = idx % 2 === 0;
            return (
              <div
                key={item.id || idx}
                onClick={() => setSelectedStationId(item.id)}
                className={`k ${isSelected ? 'timeline-selected' : ''}`}
                style={{
                  flex: 1,
                  cursor: 'pointer',
                  marginTop: isOffset ? '24px' : '0px',
                  border: isSelected ? '2px solid var(--scd-accent)' : '1.25px solid var(--scd-border)',
                  background: isSelected ? 'var(--scd-surface)' : 'var(--scd-surface-muted)',
                  padding: '12px',
                  transition: 'all 0.2s ease',
                }}
              >
                <p className="mo" style={{ color: isSelected ? 'var(--scd-accent)' : 'var(--scd-muted)' }}>
                  {formatTime(item.startTime)}
                </p>
                <p className="lbl" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  {item.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Spine View */}
      <div className="timeline-mobile-spine" style={{ display: 'flex', gap: '16px' }}>
        <div
          style={{
            width: '3px',
            background: 'var(--scd-primary)',
            borderRadius: '2px',
            flex: 'none',
            position: 'relative',
            margin: '8px 0',
          }}
        />
        <div className="c" style={{ flex: 1, gap: '10px' }}>
          {stations.map((item, idx) => {
            const isSelected = activeStation?.id === item.id;
            return (
              <div
                key={item.id || idx}
                onClick={() => setSelectedStationId(item.id)}
                className={`k ${isSelected ? 'timeline-selected' : ''}`}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--scd-accent)' : '1.25px solid var(--scd-border)',
                  background: isSelected ? 'var(--scd-surface)' : 'var(--scd-surface-muted)',
                  padding: '10px 12px',
                }}
              >
                <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mo" style={{ color: isSelected ? 'var(--scd-accent)' : 'var(--scd-muted)' }}>
                    {formatTime(item.startTime)}
                  </span>
                  <span className="mo" style={{ fontSize: '10px' }}>
                    0{idx + 1}
                  </span>
                </div>
                <p className="lbl" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  {item.title}
                </p>
                {isSelected && item.description && (
                  <div className="kd" style={{ marginTop: '8px', background: 'var(--scd-surface)' }}>
                    <p className="tx" style={{ fontSize: '12px' }}>{item.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Station detail inspection card */}
      {activeStation && (
        <div className="k" style={{ padding: '16px', gap: '12px', background: 'var(--scd-surface)' }}>
          <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="mo" style={{ color: 'var(--scd-muted)' }}>Station detail</p>
            <span className="chip on" style={{ fontSize: '10px' }}>
              {activeStation.type ?? 'Session'}
            </span>
          </div>
          <div className="r" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div className="kd" style={{ flex: '1 1 120px' }}>
              <p className="mo" style={{ fontSize: '10px' }}>Time</p>
              <p className="lbl">{formatTime(activeStation.startTime)}</p>
            </div>
            <div className="kd" style={{ flex: '1 1 120px' }}>
              <p className="mo" style={{ fontSize: '10px' }}>Category</p>
              <p className="lbl">{activeStation.type ?? 'Session'}</p>
            </div>
            <div className="kd" style={{ flex: '1 1 120px' }}>
              <p className="mo" style={{ fontSize: '10px' }}>Location</p>
              <p className="lbl">Centre of Excellence, GUNI</p>
            </div>
            <div className="kd" style={{ flex: '1 1 120px' }}>
              <p className="mo" style={{ fontSize: '10px' }}>Speaker / Lead</p>
              <p className="lbl">TBA</p>
            </div>
          </div>
          <h3 className="d3" style={{ margin: '4px 0 0' }}>{activeStation.title}</h3>
          {activeStation.description && (
            <p className="tx" style={{ fontSize: '13px', lineHeight: 1.5 }}>
              {activeStation.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
