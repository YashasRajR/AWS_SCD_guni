import type { AttendeeAchievement } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { useDocumentHead } from '../lib/seo.js';

export function MyAchievementsPage() {
  useDocumentHead({ title: 'My Achievements' });
  const { items: achievements, loading, error } = useResource<AttendeeAchievement>('/me/achievements');

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>My achievements</h1>
        <p className="page-section-lede">Track your event participation milestones.</p>
      </header>

      {loading && <p className="status-line">Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && achievements.length === 0 && (
        <div className="empty-state">
          <p>No achievements unlocked yet.</p>
          <p className="status-line">
            Complete event checkpoints and activities to earn achievements.
          </p>
        </div>
      )}

      {achievements.length > 0 && (
        <div className="achievements-grid">
          {achievements.map((a) => (
            <div key={a.id} className="achievement-card">
              <div className="achievement-icon">🏆</div>
              <div className="achievement-info">
                <p className="achievement-name">Achievement unlocked</p>
                <p className="achievement-date">
                  Unlocked {formatDateTime(a.unlockedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
