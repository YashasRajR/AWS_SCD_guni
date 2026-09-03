interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

/** A single loading placeholder block. Prefer SkeletonText/SkeletonCard for common shapes. */
export function Skeleton({ width = '100%', height = '1rem', className }: SkeletonProps) {
  return (
    <div
      className={className ? `skeleton ${className}` : 'skeleton'}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** A few lines of placeholder text, narrowing on the last line like real paragraphs do. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-text"
          style={{ width: i === lines - 1 ? '65%' : '100%' }}
        />
      ))}
    </div>
  );
}

/** A generic card-shaped placeholder for grids of speaker/session/venue cards while loading. */
export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton height="2.5rem" width="2.5rem" className="skeleton-avatar" />
      <SkeletonText lines={3} />
    </div>
  );
}

/** A row of SkeletonCards, matching the count a real grid would render. */
export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="card-grid card-grid-3" role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
