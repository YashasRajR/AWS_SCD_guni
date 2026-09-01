import { useResource } from '../lib/hooks.js';

interface AdminDashboardSummary {
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingPayments: number;
  paidPayments: number;
  checkpointCompletions: number;
  certificatesIssued: number;
  achievementsUnlocked: number;
  emailsSent: number;
  emailsFailed: number;
}

const CARDS: { key: keyof AdminDashboardSummary; label: string }[] = [
  { key: 'totalRegistrations', label: 'Total registrations' },
  { key: 'confirmedRegistrations', label: 'Confirmed registrations' },
  { key: 'pendingPayments', label: 'Pending payments' },
  { key: 'paidPayments', label: 'Paid payments' },
  { key: 'checkpointCompletions', label: 'Checkpoint completions' },
  { key: 'certificatesIssued', label: 'Certificates issued' },
  { key: 'achievementsUnlocked', label: 'Achievements unlocked' },
  { key: 'emailsSent', label: 'Emails sent' },
  { key: 'emailsFailed', label: 'Emails failed' },
];

export function DashboardPage() {
  const { data, loading, error } = useResource<AdminDashboardSummary>('/admin/dashboard');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-description">Live counts across the event.</p>
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {data && (
        <div className="stat-grid">
          {CARDS.map((card) => (
            <div className="stat-card" key={card.key}>
              <div className="stat-value">{data[card.key]}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
