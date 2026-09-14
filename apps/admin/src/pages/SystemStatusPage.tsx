import { useResource } from '../lib/hooks.js';

interface IntegrationStatus {
  name: string;
  configured: boolean;
  status: 'ok' | 'error';
  detail: string;
}

interface SystemStatus {
  database: IntegrationStatus;
  email: IntegrationStatus & { queueDepth: number };
  storage: IntegrationStatus;
  sheetsSync: IntegrationStatus & { queueDepth: number };
}

function StatusDot({ status }: { status: 'ok' | 'error' }) {
  return <span className={`status-dot status-dot-${status}`} aria-hidden="true" />;
}

export function SystemStatusPage() {
  const { data, loading, error, reload } = useResource<SystemStatus>('/admin/system-status');

  const rows: { key: string; label: string; item: IntegrationStatus; extra?: string }[] = data
    ? [
        { key: 'database', label: 'Database', item: data.database },
        {
          key: 'email',
          label: 'Email provider',
          item: data.email,
          extra: `Queue depth: ${data.email.queueDepth} pending`,
        },
        { key: 'storage', label: 'File storage', item: data.storage },
        {
          key: 'sheetsSync',
          label: 'Sheets sync',
          item: data.sheetsSync,
          extra: `Queue depth: ${data.sheetsSync.queueDepth} pending`,
        },
      ]
    : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>System status</h1>
          <p className="page-description">
            Live reachability and configuration for each integration this platform depends on.
          </p>
        </div>
        <button type="button" onClick={reload}>
          Refresh
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <div className="status-cards">
          {rows.map((row) => (
            <div className="status-card" key={row.key}>
              <div className="status-card-header">
                <StatusDot status={row.item.status} />
                <span className="status-card-title">{row.label}</span>
              </div>
              <div className="status-card-name">{row.item.name}</div>
              <div className="status-card-detail">{row.item.detail}</div>
              {row.extra && <div className="status-card-extra">{row.extra}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
