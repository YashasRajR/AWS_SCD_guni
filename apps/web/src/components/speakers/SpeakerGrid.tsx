import type { Speaker } from '@scd/types';
import { useSpeakers } from '../../lib/queries.js';
import { SpeakerCard } from './SpeakerCard.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

interface SpeakerGridProps {
  /** Cap the number of cards shown (used on the homepage teaser). */
  limit?: number;
}

/**
 * Fetches GET /api/v1/speakers itself and renders the responsive grid —
 * 1/compact column on mobile, 2 on tablet, 3–4 on desktop (see .card-grid
 * breakpoints in index.css). Owns its own loading/error/empty states so a
 * speakers-endpoint failure never takes out the rest of the page.
 */
export function SpeakerGrid({ limit }: SpeakerGridProps) {
  const { items: speakers, loading, error, reload } = useSpeakers();

  if (loading) return <SkeletonGrid count={limit ?? 4} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (speakers.length === 0) return <EmptyState message="Speakers will be announced soon." />;

  const shown = limit ? speakers.slice(0, limit) : speakers;

  // Homepage teaser: wireframe 1a "03/Speakers" is editorial, not a grid —
  // one big featured card carries the section, with the rest as smaller
  // supporting cards beside it. The full /speakers directory (no limit)
  // keeps the plain grid.
  if (limit) {
    const [featured, ...rest] = shown;
    if (!featured) return null;
    return (
      <div className="speaker-teaser">
        <SpeakerCard speaker={featured} />
        {rest.length > 0 && (
          <div className="speaker-teaser-list">
            {rest.map((speaker: Speaker) => (
              <SpeakerCard key={speaker.id} speaker={speaker} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card-grid card-grid-3">
      {shown.map((speaker: Speaker) => (
        <SpeakerCard key={speaker.id} speaker={speaker} />
      ))}
    </div>
  );
}
