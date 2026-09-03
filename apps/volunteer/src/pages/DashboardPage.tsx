import { Link } from 'react-router-dom';
import type { Checkpoint, CheckpointAttendance } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { formatDateTime, formatTime } from '../lib/format.js';

interface VolunteerMe {
  id: string;
  name: string;
  phone: string | null;
  status: string;
}

export function DashboardPage() {
  const { data: me, loading: meLoading } = useResource<VolunteerMe>('/volunteer/me');
  const { items: checkpoints, loading: cpLoading } = useResource<Checkpoint>('/volunteer/checkpoints');
  const { items: history } = useResource<CheckpointAttendance>('/volunteer/history');

  const recentHistory = history.slice(0, 5);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Volunteer dashboard</h1>
          {me && <p className="page-description">Welcome, {me.name}</p>}
        </div>
      </div>

      {meLoading && <p className="status-line">Loading…</p>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{cpLoading ? '…' : checkpoints.length}</div>
          <div className="stat-label">Assigned checkpoints</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">Total check-ins recorded</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2>Your checkpoints</h2>
          {checkpoints.length === 0 ? (
            <p className="status-line">No checkpoints assigned yet.</p>
          ) : (
            <ul className="checkpoint-list">
              {checkpoints.map((c) => (
                <li key={c.id}>
                  <Link to={`/checkpoints/${c.id}`}>
                    {c.name}
                    {c.location && <span className="dashboard-card-meta"> · {c.location}</span>}
                    {c.startTime && (
                      <span className="dashboard-card-meta">
                        {' '}
                        · {formatTime(c.startTime)}
                        {c.endTime ? ` – ${formatTime(c.endTime)}` : ''}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card">
          <h2>Recent check-ins</h2>
          {recentHistory.length === 0 ? (
            <p className="status-line">No check-ins recorded yet.</p>
          ) : (
            <ul className="checkpoint-list">
              {recentHistory.map((h) => (
                <li key={h.id}>
                  <strong>{h.attendeeName ?? 'Attendee'}</strong>
                  <span className="dashboard-card-meta">
                    {' '}
                    · {h.checkpointName ?? 'Checkpoint'}
                  </span>
                  <span className="dashboard-card-meta">
                    {' '}
                    · {formatDateTime(h.completedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {history.length > 5 && (
            <Link to="/history" className="btn-link">
              View all history →
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
