import { Link } from 'react-router-dom';
import type { Checkpoint } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { formatTime } from '../lib/format.js';

export function CheckpointsPage() {
  const { items: checkpoints, loading, error } = useResource<Checkpoint>('/volunteer/checkpoints');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Your checkpoints</h1>
      </div>

      {loading && <p className="status-line">Loading…</p>}
      {error && <p className="status-line status-error">{error}</p>}
      {!loading && !error && checkpoints.length === 0 && (
        <p className="status-line">You haven&apos;t been assigned to any checkpoints yet.</p>
      )}

      <div className="checkpoint-card-list">
        {checkpoints.map((c) => (
          <Link key={c.id} to={`/checkpoints/${c.id}`} className="checkpoint-card">
            <div>
              <h2>{c.name}</h2>
              {c.location && <p className="checkpoint-card-meta">{c.location}</p>}
              {(c.startTime || c.endTime) && (
                <p className="checkpoint-card-meta">
                  {formatTime(c.startTime)} – {formatTime(c.endTime)}
                </p>
              )}
            </div>
            <span className="checkpoint-card-arrow">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
