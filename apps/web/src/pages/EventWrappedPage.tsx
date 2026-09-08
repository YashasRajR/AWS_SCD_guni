import { useEffect, useMemo, useRef, useState } from 'react';
import type { EventWrapped } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { useDocumentHead } from '../lib/seo.js';

const SLIDE_MS = 5000;

/**
 * Uses the real Web Share API where available (mobile browsers, most
 * desktop browsers as of 2024+), falling back to copying a share-ready
 * summary to the clipboard. Never claims a post was made to a specific
 * platform — this only ever hands the OS's real share sheet or the
 * clipboard, both of which the user themselves controls the destination of.
 */
async function shareWrapped(wrapped: EventWrapped): Promise<'shared' | 'copied' | 'failed'> {
  const text = `I completed ${wrapped.statistics.checkpointsCompleted}/${wrapped.statistics.totalCheckpoints} checkpoints and unlocked ${wrapped.statistics.achievementsUnlocked} achievements at AWS Student Community Day 2026!`;
  const shareData = { title: 'My AWS Student Community Day 2026 Wrapped', text, url: window.location.href };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch {
      // User cancelled the native share sheet — not an error.
      return 'failed';
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${window.location.href}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}

interface Slide {
  label: string;
  /** A numeral slide counts up to `value`; a pure-text slide (thank you) has none. */
  value?: number;
  suffix?: string;
  caption: string;
}

/** Wireframe 1i "/dashboard/wrapped": 6 numeral slides built only from real
 * statistics the API returns -- no "hours in the room" slide, since that
 * figure doesn't exist anywhere in this app's data model, and inventing one
 * would violate the platform's no-fabricated-numbers rule. */
function buildSlides(wrapped: EventWrapped): Slide[] {
  const s = wrapped.statistics;
  const slides: Slide[] = [
    { label: 'Sessions attended', value: s.sessionsAttended, caption: 'sessions attended' },
    { label: 'Checkpoints', value: s.checkpointsCompleted, suffix: `/${s.totalCheckpoints}`, caption: 'checkpoints completed' },
    { label: 'Participation', value: s.participationPercentage, suffix: '%', caption: 'participation rate' },
    { label: 'Badges', value: s.achievementsUnlocked, caption: 'achievements unlocked' },
  ];
  if (s.topInterest) {
    slides.push({ label: 'Top track', caption: s.topInterest });
  }
  slides.push({
    label: 'Thank you',
    caption: wrapped.summary ?? 'Thanks for building with us at AWS Student Community Day 2026.',
  });
  return slides;
}

function useCountUp(target: number | undefined, active: boolean): number {
  const [value, setValue] = useState(target ?? 0);
  useEffect(() => {
    if (target === undefined) return;
    if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const duration = 700;
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);
  return value;
}

function WrappedStory({ wrapped }: { wrapped: EventWrapped }) {
  const slides = useMemo(() => buildSlides(wrapped), [wrapped]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied' | 'failed'>('idle');
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const isLast = index === slides.length - 1;
  const goNext = () => setIndex((i) => Math.min(i + 1, slides.length - 1));
  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));

  // 5s auto-advance; paused on hold and switched off for reduced motion.
  useEffect(() => {
    if (paused || isLast || reducedMotion.current) return;
    const id = window.setTimeout(goNext, SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, isLast]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const slide = slides[index]!;
  const count = useCountUp(slide.value, true);

  const handleShare = async () => {
    const result = await shareWrapped(wrapped);
    setShareStatus(result);
  };

  return (
    <div className="wrapped-story">
      <div className="wrapped-story-bars">
        {slides.map((s, i) => (
          <div key={s.label} className="wrapped-story-bar">
            <div
              className="wrapped-story-bar-fill"
              style={{ width: i <= index ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="wrapped-story-zone wrapped-story-zone-left"
        aria-label="Previous slide"
        onClick={goPrev}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        disabled={index === 0}
      />
      <button
        type="button"
        className="wrapped-story-zone wrapped-story-zone-right"
        aria-label="Next slide"
        onClick={goNext}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        disabled={isLast}
      />

      <div className="wrapped-story-content">
        <p className="wrapped-story-index">
          {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')} · hold to pause
        </p>
        {slide.value !== undefined ? (
          <p className="wrapped-story-number">
            {count}
            {slide.suffix ?? ''}
          </p>
        ) : (
          <p className="wrapped-story-number wrapped-story-number-text">{slide.caption}</p>
        )}
        {slide.value !== undefined && <p className="wrapped-story-caption">{slide.caption}</p>}

        {isLast && (
          <div className="wrapped-story-actions">
            <button type="button" className="btn btn-secondary" onClick={handleShare}>
              Copy caption
            </button>
            {shareStatus === 'copied' && <p className="status-line">Copied — paste it anywhere you like.</p>}
            {shareStatus === 'shared' && <p className="status-line">Shared.</p>}
            {shareStatus === 'failed' && <p className="status-line">Could not share — try copying manually.</p>}
          </div>
        )}
      </div>

      <div className="wrapped-story-controls">
        <button type="button" className="btn-link" onClick={goPrev} disabled={index === 0}>
          ← Back
        </button>
        <button type="button" className="btn-link" onClick={goNext} disabled={isLast}>
          Next →
        </button>
      </div>
    </div>
  );
}

export function EventWrappedPage() {
  useDocumentHead({ title: 'Event Wrapped' });
  const { data: wrapped, loading, error } = useResource<EventWrapped>('/me/event-wrapped');

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>Event wrapped</h1>
        <p className="page-section-lede">Your personalized summary of AWS Student Community Day 2026.</p>
      </header>

      {loading && <p className="status-line">Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && !wrapped && (
        <div className="empty-state">
          <p>Your event summary is being generated.</p>
          <p className="status-line">Check back after the event.</p>
        </div>
      )}

      {wrapped && <WrappedStory wrapped={wrapped} />}
    </div>
  );
}
