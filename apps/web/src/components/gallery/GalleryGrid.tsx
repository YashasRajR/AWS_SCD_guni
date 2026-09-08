import { useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryItem } from '@scd/types';
import { useGallery } from '../../lib/queries.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

/** A minimal in-page lightbox — no external library, just a full-screen
 * overlay with the selected photo, its caption, and Escape/click-outside
 * to close, plus arrow-key/button navigation between photos (spec section
 * 9 / wireframe 1k: "arrow keys, Esc, focus restore to the tile"). */
function Lightbox({
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
    <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label={item.caption ?? 'Photo'} onClick={onClose}>
      <button type="button" className="lightbox-close" aria-label="Close" onClick={onClose}>
        ×
      </button>
      {hasPrev && (
        <button
          type="button"
          className="lightbox-nav lightbox-nav-prev"
          aria-label="Previous photo"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
        >
          ←
        </button>
      )}
      <figure className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
        <img src={item.imageUrl} alt={item.altText ?? item.caption ?? ''} />
        {item.caption && <figcaption>{item.caption}</figcaption>}
      </figure>
      {hasNext && (
        <button
          type="button"
          className="lightbox-nav lightbox-nav-next"
          aria-label="Next photo"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          →
        </button>
      )}
    </div>
  );
}

export function GalleryGrid() {
  const { items, loading, error, reload } = useGallery();
  const [activeYear, setActiveYear] = useState<number | 'ALL'>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const years = useMemo(
    () => Array.from(new Set(items.map((i) => i.eventYear).filter((y): y is number => y !== null))).sort(
      (a, b) => b - a,
    ),
    [items],
  );
  const filtered = activeYear === 'ALL' ? items : items.filter((i) => i.eventYear === activeYear);

  const closeLightbox = () => {
    setSelectedIndex(null);
    lastTriggerRef.current?.focus();
  };

  if (loading) return <SkeletonGrid count={8} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (items.length === 0) return <EmptyState message="Photos from the event will be posted here." />;

  return (
    <>
      {years.length > 1 && (
        <div className="session-filters">
          <button
            type="button"
            className={activeYear === 'ALL' ? 'filter-chip filter-chip-active' : 'filter-chip'}
            onClick={() => setActiveYear('ALL')}
          >
            All
          </button>
          {years.map((year) => (
            <button
              key={year}
              type="button"
              className={activeYear === year ? 'filter-chip filter-chip-active' : 'filter-chip'}
              onClick={() => setActiveYear(year)}
            >
              {year}
            </button>
          ))}
        </div>
      )}
      <div className="gallery-grid">
        {filtered.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className="gallery-item"
            onClick={(e) => {
              lastTriggerRef.current = e.currentTarget;
              setSelectedIndex(index);
            }}
            aria-label={item.caption ?? 'View photo'}
          >
            <img src={item.imageUrl} alt={item.altText ?? item.caption ?? ''} loading="lazy" />
            {item.caption && <span className="gallery-item-caption">{item.caption}</span>}
          </button>
        ))}
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
    </>
  );
}
