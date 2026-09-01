import type { CheckpointAttendance } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';

export function HistoryPage() {
  const { items: history, loading, error } = useResource<CheckpointAttendance>('/volunteer/history');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Check-in history</h1>
      </div>

      {loading && <p className="status-line">Loading…</p>}
      {error && <p className="status-line status-error">{error}</p>}
      {!loading && !error && history.length === 0 && <p className="status-line">No check-ins yet.</p>}

      <ul className="history-list">
        {history.map((h) => (
          <li key={h.id} className="history-item">
            <div>
              <strong>{h.attendeeName ?? h.attendeeId}</strong>
              <p className="history-item-meta">{h.checkpointName ?? h.checkpointId}</p>
            </div>
            <span className="history-item-time">{formatDateTime(h.completedAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
