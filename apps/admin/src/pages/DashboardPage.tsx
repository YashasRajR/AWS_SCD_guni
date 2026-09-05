import { useResource } from '../lib/hooks.js';
import { BarChart } from '../components/charts/BarChart.js';
import { HorizontalBars } from '../components/charts/HorizontalBars.js';

interface DailyCount {
  day: string;
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface AdminDashboardTrends {
  registrationsByDay: DailyCount[];
  checkpointCompletionsByDay: DailyCount[];
  registrationsByStatus: StatusCount[];
}

function formatDayLabel(iso: string): string {
  const date = new Date(iso + 'T00:00:00');
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'var(--green-text)',
  PENDING: 'var(--amber-text)',
  WAITLISTED: 'var(--blue-text)',
  CANCELLED: 'var(--gray-text)',
  REJECTED: 'var(--danger)',
};

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
  const { data: trends } = useResource<AdminDashboardTrends>('/admin/dashboard/trends');

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

      {trends && (
        <>
          <div className="chart-section">
            <h2>Registrations, last 14 days</h2>
            <BarChart
              data={trends.registrationsByDay.map((d) => ({ label: d.day, value: d.count }))}
              formatLabel={formatDayLabel}
            />
          </div>

          <div className="chart-section">
            <h2>Checkpoint completions, last 14 days</h2>
            <BarChart
              data={trends.checkpointCompletionsByDay.map((d) => ({ label: d.day, value: d.count }))}
              formatLabel={formatDayLabel}
              color="var(--blue-text)"
            />
          </div>

          <div className="chart-section">
            <h2>Registrations by status</h2>
            <HorizontalBars
              data={trends.registrationsByStatus.map((s) => ({
                label: s.status,
                value: s.count,
                color: STATUS_COLORS[s.status],
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
