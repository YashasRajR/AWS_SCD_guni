import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSpeakers } from '../../lib/queries.js';
import { SpeakerCard } from './SpeakerCard.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

interface SpeakerGridProps {
  limit?: number;
}

export function SpeakerGrid({ limit }: SpeakerGridProps) {
  const { items: speakers, loading, error, reload } = useSpeakers();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (loading) return <SkeletonGrid count={limit ?? 4} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (speakers.length === 0) return <EmptyState message="Speakers will be announced soon." />;

  const shown = limit ? speakers.slice(0, limit) : speakers;
  const activeSpeaker = (selectedId ? shown.find((s) => s.id === selectedId) : null) ?? shown[0]!;
  const supportingSpeakers = shown.filter((s) => s.id !== activeSpeaker.id);

  // Placeholder slots to complete the line-up per wireframe 1d callout:
  // "Unconfirmed = explicit TBA / Stay tuned… placeholder, never a made-up name"
  const tbaSlots = Math.max(0, 4 - shown.length);

  return (
    <div className="c" style={{ gap: '24px' }}>
      {/* Editorial layout: 1 big card + supporting cards */}
      <div className="r" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        {/* Featured speaker card */}
        <div className="k" style={{ flex: '1 1 320px', minWidth: '280px', maxWidth: '440px', gap: '12px' }}>
          <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="mo" style={{ color: 'var(--scd-muted)' }}>Featured speaker</p>
            <span className="chip on" style={{ fontSize: '10px' }}>Featured</span>
          </div>

          <div
            style={{
              aspectRatio: '4/5',
              width: '100%',
              maxHeight: '340px',
              borderRadius: '3px',
              overflow: 'hidden',
              background: 'var(--scd-surface-muted)',
            }}
          >
            {activeSpeaker.profileImage ? (
              <img
                src={activeSpeaker.profileImage}
                alt={activeSpeaker.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'grayscale(0.5) contrast(1.1)',
                  transition: 'filter 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'none';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'grayscale(0.5) contrast(1.1)';
                }}
              />
            ) : (
              <div
                className="speaker-photo-placeholder"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 800,
                  fontFamily: 'var(--scd-mono)',
                  background: 'repeating-linear-gradient(45deg, #e6e2da 0 6px, #f4f1eb 6px 12px)',
                  color: 'var(--scd-primary)',
                }}
              >
                {activeSpeaker.name.charAt(0)}
              </div>
            )}
          </div>

          <h2 className="d2" style={{ margin: '4px 0 0', fontSize: '22px' }}>
            {activeSpeaker.name}
          </h2>
          <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '12px' }}>
            {[activeSpeaker.designation, activeSpeaker.organization].filter(Boolean).join(' · ')}
          </p>

          {activeSpeaker.bio && (
            <p className="tx" style={{ fontSize: '13px', lineHeight: 1.6 }}>
              {activeSpeaker.bio}
            </p>
          )}

          <div className="r" style={{ gap: '8px', marginTop: '4px' }}>
            <Link to={`/speakers/${activeSpeaker.id}`} className="btn o" style={{ textDecoration: 'none' }}>
              Full speaker profile →
            </Link>
          </div>
        </div>

        {/* Supporting cards column */}
        <div className="c" style={{ flex: '1 1 400px', gap: '16px' }}>
          <p className="tx" style={{ color: 'var(--scd-muted)' }}>
            Select any speaker below to preview their bio and sessions. Line-up updates as speakers confirm.
          </p>

          <div
            className="speaker-grid-container"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            {supportingSpeakers.map((speaker) => (
              <SpeakerCard
                key={speaker.id}
                speaker={speaker}
                isSelected={speaker.id === activeSpeaker.id}
                onSelect={() => setSelectedId(speaker.id)}
              />
            ))}

            {/* TBA placeholders */}
            {Array.from({ length: tbaSlots }).map((_, i) => (
              <div
                key={`tba-${i}`}
                className="kd mut"
                style={{
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  minHeight: '180px',
                  gap: '8px',
                  borderStyle: 'dashed',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '68px',
                    aspectRatio: '4/5',
                    borderRadius: '3px',
                    background: 'repeating-linear-gradient(45deg, #e6e2da 0 4px, #f4f1eb 4px 8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--scd-mono)',
                    fontSize: '11px',
                    color: 'var(--scd-muted)',
                  }}
                >
                  4:5
                </div>
                <p className="lbl" style={{ color: 'var(--scd-muted)' }}>Speaker TBA</p>
                <p className="mo" style={{ fontSize: '10px', color: 'var(--scd-muted)' }}>Stay tuned…</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
