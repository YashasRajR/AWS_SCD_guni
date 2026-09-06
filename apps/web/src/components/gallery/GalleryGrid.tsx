import { useEffect, useState } from 'react';
import type { GalleryItem } from '@scd/types';
import { useGallery } from '../../lib/queries.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

/** A minimal in-page lightbox — no external library, just a full-screen
 * overlay with the selected photo, its caption, and Escape/click-outside
 * to close (spec section 9: "Lightbox"). */
function Lightbox({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label={item.caption ?? 'Photo'} onClick={onClose}>
      <button type="button" className="lightbox-close" aria-label="Close" onClick={onClose}>
        ×
      </button>
      <figure className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
        <img src={item.imageUrl} alt={item.altText ?? item.caption ?? ''} />
        {item.caption && <figcaption>{item.caption}</figcaption>}
      </figure>
    </div>
  );
}

export function GalleryGrid() {
  const { items, loading, error, reload } = useGallery();
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  if (loading) return <SkeletonGrid count={8} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (items.length === 0) return <EmptyState message="Photos from the event will be posted here." />;

  return (
    <>
      <div className="gallery-grid">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className="gallery-item"
            onClick={() => setSelected(item)}
            aria-label={item.caption ?? 'View photo'}
          >
            <img src={item.imageUrl} alt={item.altText ?? item.caption ?? ''} loading="lazy" />
            {item.caption && <span className="gallery-item-caption">{item.caption}</span>}
          </button>
        ))}
      </div>
      {selected && <Lightbox item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
