import { Link } from 'react-router-dom';
import { useResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { BarChart } from '../components/charts/BarChart.js';
import { HorizontalBars } from '../components/charts/HorizontalBars.js';
import { StatusBadge } from '../components/StatusBadge.js';

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
  registrationsToday: number;
  registrationsThisWeek: number;
  registrationsThisMonth: number;
  checkpointCompletions: number;
  checkInCount: number;
  checkInPercentage: number;
  activeVolunteers: number;
  certificatesIssued: number;
  achievementsUnlocked: number;
  emailsSent: number;
  emailsFailed: number;
  eventName: string | null;
  eventStatus: string | null;
  eventDate: string | null;
}

interface RecentRegistration {
  id: string;
  registrationNumber: string;
  fullName: string;
  status: string;
  createdAt: string;
}

interface RecentCheckIn {
  id: string;
  attendeeName: string;
  checkpointName: string;
  volunteerName: string | null;
  completedAt: string;
}

interface AdminDashboardRecentActivity {
  recentRegistrations: RecentRegistration[];
  recentCheckIns: RecentCheckIn[];
}

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

type NumericSummaryKey = {
  [K in keyof AdminDashboardSummary]: AdminDashboardSummary[K] extends number ? K : never;
}[keyof AdminDashboardSummary];

const CARDS: { key: NumericSummaryKey; label: string }[] = [
  { key: 'totalRegistrations', label: 'Total registrations' },
  { key: 'registrationsToday', label: 'Registrations today' },
  { key: 'registrationsThisWeek', label: 'Registrations this week' },
  { key: 'registrationsThisMonth', label: 'Registrations this month' },
  { key: 'confirmedRegistrations', label: 'Confirmed registrations' },
  { key: 'checkInCount', label: 'Checked in' },
  { key: 'activeVolunteers', label: 'Active volunteers' },
  { key: 'certificatesIssued', label: 'Certificates issued' },
  { key: 'achievementsUnlocked', label: 'Achievements unlocked' },
  { key: 'emailsSent', label: 'Emails sent' },
  { key: 'emailsFailed', label: 'Emails failed' },
];

export function DashboardPage() {
  const { data, loading, error } = useResource<AdminDashboardSummary>('/admin/dashboard');
  const { data: trends } = useResource<AdminDashboardTrends>('/admin/dashboard/trends');
  const { data: recent } = useResource<AdminDashboardRecentActivity>('/admin/dashboard/recent-activity');
  const { data: systemStatus } = useResource<SystemStatus>('/admin/system-status');

  const failingIntegrations = systemStatus
    ? (
        [
          ['Database', systemStatus.database],
          ['Email', systemStatus.email],
          ['File storage', systemStatus.storage],
          ['Sheets sync', systemStatus.sheetsSync],
        ] as [string, IntegrationStatus][]
      ).filter(([, s]) => s.status !== 'ok')
    : [];

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
        <div className="dashboard-alerts">
          {data.eventName && (
            <div className="dashboard-alert dashboard-alert-info">
              <strong>{data.eventName}</strong>
              {data.eventStatus && <StatusBadge status={data.eventStatus} />}
              {data.eventDate && <span>{formatDateTime(data.eventDate)}</span>}
            </div>
          )}
          {failingIntegrations.map(([label, s]) => (
            <div className="dashboard-alert dashboard-alert-danger" key={label}>
              {label}: {s.detail} <Link to="/system-status">View system status →</Link>
            </div>
          ))}
          {systemStatus && systemStatus.sheetsSync.queueDepth > 0 && (
            <div className="dashboard-alert dashboard-alert-warning">
              {systemStatus.sheetsSync.queueDepth} spreadsheet sync{' '}
              {systemStatus.sheetsSync.queueDepth === 1 ? 'row' : 'rows'} pending/retrying.{' '}
              <Link to="/sheets-sync">View queue →</Link>
            </div>
          )}
        </div>
      )}

      {data && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{data.checkInPercentage}%</div>
            <div className="stat-label">Check-in rate</div>
          </div>
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

      {recent && (
        <div className="dashboard-recent-grid">
          <div className="dashboard-recent-section">
            <h2>Recent registrations</h2>
            {recent.recentRegistrations.length === 0 ? (
              <p className="status-line">No registrations yet.</p>
            ) : (
              <ul className="dashboard-recent-list">
                {recent.recentRegistrations.map((r) => (
                  <li key={r.id}>
                    <span>{r.fullName}</span>
                    <StatusBadge status={r.status} />
                    <span className="dashboard-recent-meta">{formatDateTime(r.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="dashboard-recent-section">
            <h2>Recent check-ins</h2>
            {recent.recentCheckIns.length === 0 ? (
              <p className="status-line">No check-ins yet.</p>
            ) : (
              <ul className="dashboard-recent-list">
                {recent.recentCheckIns.map((c) => (
                  <li key={c.id}>
                    <span>{c.attendeeName}</span>
                    <span className="dashboard-recent-meta">{c.checkpointName}</span>
                    <span className="dashboard-recent-meta">{formatDateTime(c.completedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
