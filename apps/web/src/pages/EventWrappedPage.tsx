import { useState } from 'react';
import type { EventWrapped } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { useDocumentHead } from '../lib/seo.js';

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

export function EventWrappedPage() {
  useDocumentHead({ title: 'Event Wrapped' });
  const { data: wrapped, loading, error } = useResource<EventWrapped>('/me/event-wrapped');
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied' | 'failed'>('idle');

  const handleShare = async () => {
    if (!wrapped) return;
    const result = await shareWrapped(wrapped);
    setShareStatus(result);
  };

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

      {wrapped && (
        <div className="dashboard-grid">
          <section className="dashboard-card wrapped-highlight">
            <h2>Your participation</h2>
            <div className="wrapped-stat-big">
              <span className="wrapped-number">{wrapped.statistics.participationPercentage}%</span>
              <span className="wrapped-label">participation rate</span>
            </div>
          </section>

          <section className="dashboard-card">
            <h2>Checkpoints</h2>
            <div className="wrapped-stat">
              <span className="wrapped-number">{wrapped.statistics.checkpointsCompleted}</span>
              <span className="wrapped-label">
                of {wrapped.statistics.totalCheckpoints} completed
              </span>
            </div>
          </section>

          <section className="dashboard-card">
            <h2>Achievements</h2>
            <div className="wrapped-stat">
              <span className="wrapped-number">{wrapped.statistics.achievementsUnlocked}</span>
              <span className="wrapped-label">unlocked</span>
            </div>
          </section>

          <section className="dashboard-card">
            <h2>Certificate</h2>
            <p className="status-line">
              {wrapped.statistics.certificateUnlocked
                ? '✓ Certificate received'
                : 'Certificate pending'}
            </p>
          </section>

          {wrapped.summary && (
            <section className="dashboard-card wrapped-summary">
              <h2>Summary</h2>
              <p>{wrapped.summary}</p>
            </section>
          )}

          <section className="dashboard-card">
            <p className="dashboard-card-meta">
              Generated {formatDateTime(wrapped.generatedAt)}
            </p>
            <button type="button" className="btn btn-secondary" onClick={handleShare}>
              Share my wrapped
            </button>
            {shareStatus === 'copied' && <p className="status-line">Copied to clipboard — paste it anywhere you like.</p>}
            {shareStatus === 'shared' && <p className="status-line">Shared.</p>}
            {shareStatus === 'failed' && <p className="status-line">Could not share — try copying the link manually.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
