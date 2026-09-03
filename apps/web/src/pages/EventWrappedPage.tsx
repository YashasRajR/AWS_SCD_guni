import type { EventWrapped } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { useDocumentHead } from '../lib/seo.js';

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
          </section>
        </div>
      )}
    </div>
  );
}
