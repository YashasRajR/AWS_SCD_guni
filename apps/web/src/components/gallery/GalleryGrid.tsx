import { useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryItem } from '@scd/types';
import { useGallery } from '../../lib/queries.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

export function Lightbox({
  item,
  hasPrev,
  hasNext,
  onClose,
  onPrev,
  onNext,
}: {
  item: GalleryItem;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft' && hasPrev) onPrev();
      else if (event.key === 'ArrowRight' && hasNext) onNext();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption ?? 'Photo'}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 24, 31, 0.92)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="k inv"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '840px',
          width: '100%',
          padding: '16px',
          gap: '12px',
          border: '1.5px solid #fff',
          borderRadius: '4px',
          background: 'var(--scd-primary)',
          color: '#fff',
        }}
      >
        <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="mo" style={{ color: 'var(--scd-accent)' }}>
            Photo inspection {item.eventYear ? `· ${item.eventYear}` : ''}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="lbl"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
            aria-label="Close photo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="r" style={{ alignItems: 'center', gap: '12px' }}>
          {hasPrev ? (
            <button
              type="button"
              className="btn g"
              onClick={onPrev}
              style={{ color: '#fff', borderColor: '#fff', minWidth: '40px', justifyContent: 'center' }}
              aria-label="Previous photo"
            >
              ←
            </button>
          ) : (
            <div style={{ width: '40px' }} />
          )}

          <div
            style={{
              flex: 1,
              maxHeight: '65vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: '2px',
              background: '#000',
            }}
          >
            <img
              src={item.imageUrl}
              alt={item.altText ?? item.caption ?? 'Event photo'}
              style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
            />
          </div>

          {hasNext ? (
            <button
              type="button"
              className="btn g"
              onClick={onNext}
              style={{ color: '#fff', borderColor: '#fff', minWidth: '40px', justifyContent: 'center' }}
              aria-label="Next photo"
            >
              →
            </button>
          ) : (
            <div style={{ width: '40px' }} />
          )}
        </div>

        <div className="r" style={{ justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
          <p className="tx" style={{ color: '#cfc9be', fontSize: '13px' }}>
            {item.caption || item.altText || 'AWS Student Community Day moment'}
          </p>
          <p className="mo" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
            Use ← → arrow keys to navigate · Esc to close
          </p>
        </div>
      </div>
    </div>
  );
}

export function GalleryGrid() {
  const { items, loading, error, reload } = useGallery();
  const [activeYear, setActiveYear] = useState<number | 'ALL'>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const years = useMemo(() => {
    const rawYears = items.map((i) => i.eventYear).filter((y): y is number => y !== null);
    const set = new Set([2026, 2025, 2024, ...rawYears]);
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  const filtered = activeYear === 'ALL' ? items : items.filter((i) => i.eventYear === activeYear);

  const closeLightbox = () => {
    setSelectedIndex(null);
    lastTriggerRef.current?.focus();
  };

  if (loading) return <SkeletonGrid count={8} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (items.length === 0) return <EmptyState message="Photos from the event will be posted here." />;

  return (
    <div className="c" style={{ gap: '20px' }}>
      {/* Year Filter chips */}
      <div className="r" style={{ gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          className={`chip ${activeYear === 'ALL' ? 'on' : ''}`}
          aria-pressed={activeYear === 'ALL'}
          onClick={() => setActiveYear('ALL')}
          style={{
            cursor: 'pointer',
            border: '1px solid var(--scd-fg)',
            fontFamily: 'var(--scd-mono)',
            fontSize: '11px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: activeYear === 'ALL' ? 'var(--scd-accent)' : 'var(--scd-surface)',
            color: 'var(--scd-fg)',
          }}
        >
          All
        </button>
        {years.map((year) => {
          const isSelected = activeYear === year;
          return (
            <button
              key={year}
              type="button"
              className={`chip ${isSelected ? 'on' : ''}`}
              aria-pressed={isSelected}
              onClick={() => setActiveYear(year)}
              style={{
                cursor: 'pointer',
                border: '1px solid var(--scd-fg)',
                fontFamily: 'var(--scd-mono)',
                fontSize: '11px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: isSelected ? 'var(--scd-accent)' : 'var(--scd-surface)',
                color: 'var(--scd-fg)',
              }}
            >
              {year}
            </button>
          );
        })}
      </div>

      {/* Masonry-style grid alternating 4:5 and 1:1 image ratios per wireframe 1k */}
      <div
        className="gallery-masonry"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '14px',
        }}
      >
        {filtered.map((item, index) => {
          // Alternating ratio pattern: 4:5 and 1:1
          const isPortrait = index % 3 !== 1;
          const ratio = isPortrait ? '4 / 5' : '1 / 1';

          return (
            <button
              type="button"
              key={item.id}
              data-reveal
              onClick={(e) => {
                lastTriggerRef.current = e.currentTarget;
                setSelectedIndex(index);
              }}
              aria-label={item.caption ?? 'View full photo'}
              style={{
                aspectRatio: ratio,
                width: '100%',
                padding: 0,
                border: '1.25px solid var(--scd-border)',
                borderRadius: '3px',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                background: 'var(--scd-surface-muted)',
                textAlign: 'left',
              }}
            >
              <img
                src={item.imageUrl}
                alt={item.altText ?? item.caption ?? ''}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
              {item.caption && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(20,24,31,0.85) 0%, transparent 100%)',
                    padding: '24px 10px 8px',
                    color: '#fff',
                  }}
                >
                  <p className="mo" style={{ fontSize: '10px', color: '#fff' }}>
                    {item.caption}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedIndex !== null && filtered[selectedIndex] && (
        <Lightbox
          item={filtered[selectedIndex]}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < filtered.length - 1}
          onClose={closeLightbox}
          onPrev={() => setSelectedIndex((i) => (i !== null ? i - 1 : i))}
          onNext={() => setSelectedIndex((i) => (i !== null ? i + 1 : i))}
        />
      )}
    </div>
  );
}
