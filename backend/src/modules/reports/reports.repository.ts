import { getPool } from '../../config/database.js';
import type {
  AdminDashboardRecentActivity,
  AdminDashboardSummary,
  AdminDashboardTrends,
  DailyCount,
  RecentCheckIn,
  RecentRegistration,
  StatusCount,
} from './reports.types.js';

const RECENT_ACTIVITY_LIMIT = 8;

async function count(sql: string): Promise<number> {
  const { rows } = await getPool().query<{ count: string }>(sql);
  return Number(rows[0]?.count ?? 0);
}

/** Last 14 days, oldest first, zero-filled for any day with no rows. */
async function dailyCountsLast14Days(table: string, dateColumn: string, extraWhere = ''): Promise<DailyCount[]> {
  const { rows } = await getPool().query<{ day: string; count: string }>(
    `SELECT date_trunc('day', ${dateColumn})::date::text AS day, count(*)::text AS count
     FROM ${table}
     WHERE ${dateColumn} >= now() - interval '13 days'${extraWhere ? ` AND ${extraWhere}` : ''}
     GROUP BY day
     ORDER BY day`,
  );
  const byDay = new Map(rows.map((r) => [r.day, Number(r.count)]));
  const result: DailyCount[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    result.push({ day, count: byDay.get(day) ?? 0 });
  }
  return result;
}

export const reportsRepository = {
  /**
   * table/dateColumn are always fixed, hardcoded strings from the two
   * call sites below, never user input — same injection-safety rule as
   * utils/sql.ts's paginatedListQuery.
   */
  async getTrends(): Promise<AdminDashboardTrends> {
    const [registrationsByDay, checkpointCompletionsByDay, statusRows] = await Promise.all([
      dailyCountsLast14Days('registrations', 'created_at'),
      dailyCountsLast14Days('checkpoint_attendance', 'completed_at', `status = 'COMPLETED'`),
      getPool().query<{ status: string; count: string }>(
        'SELECT status, count(*)::text AS count FROM registrations GROUP BY status',
      ),
    ]);
    const registrationsByStatus: StatusCount[] = statusRows.rows.map((r) => ({
      status: r.status,
      count: Number(r.count),
    }));
    return { registrationsByDay, checkpointCompletionsByDay, registrationsByStatus };
  },

  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const [
      totalRegistrations,
      confirmedRegistrations,
      registrationsToday,
      registrationsThisWeek,
      registrationsThisMonth,
      checkpointCompletions,
      checkInCount,
      activeVolunteers,
      certificatesIssued,
      achievementsUnlocked,
      emailsSent,
      emailsFailed,
      eventRow,
    ] = await Promise.all([
      count('SELECT count(*) FROM registrations'),
      count(`SELECT count(*) FROM registrations WHERE status = 'CONFIRMED'`),
      count(`SELECT count(*) FROM registrations WHERE created_at >= date_trunc('day', now())`),
      count(`SELECT count(*) FROM registrations WHERE created_at >= date_trunc('week', now())`),
      count(`SELECT count(*) FROM registrations WHERE created_at >= date_trunc('month', now())`),
      count(`SELECT count(*) FROM checkpoint_attendance WHERE status = 'COMPLETED'`),
      count(
        `SELECT count(DISTINCT ca.attendee_id) FROM checkpoint_attendance ca
         JOIN checkpoints c ON c.id = ca.checkpoint_id
         WHERE ca.status = 'COMPLETED' AND c.is_required = true`,
      ),
      count(`SELECT count(*) FROM volunteers WHERE status = 'ACTIVE'`),
      count(`SELECT count(*) FROM certificates WHERE status = 'ISSUED'`),
      count('SELECT count(*) FROM attendee_achievements'),
      count(`SELECT count(*) FROM email_records WHERE status = 'SENT'`),
      count(`SELECT count(*) FROM email_records WHERE status = 'FAILED'`),
      getPool().query<{ name: string; status: string; event_date: string }>(
        'SELECT name, status, event_date::text AS event_date FROM events ORDER BY created_at DESC LIMIT 1',
      ),
    ]);

    const checkInPercentage =
      confirmedRegistrations > 0 ? Math.round((checkInCount / confirmedRegistrations) * 1000) / 10 : 0;

    const event = eventRow.rows[0];

    return {
      totalRegistrations,
      confirmedRegistrations,
      registrationsToday,
      registrationsThisWeek,
      registrationsThisMonth,
      checkpointCompletions,
      checkInCount,
      checkInPercentage,
      activeVolunteers,
      certificatesIssued,
      achievementsUnlocked,
      emailsSent,
      emailsFailed,
      eventName: event?.name ?? null,
      eventStatus: event?.status ?? null,
      eventDate: event?.event_date ?? null,
    };
  },

  async getRecentActivity(): Promise<AdminDashboardRecentActivity> {
    const [registrationsRows, checkInsRows] = await Promise.all([
      getPool().query<{
        id: string;
        registration_number: string;
        full_name: string;
        status: string;
        created_at: string;
      }>(
        `SELECT r.id, r.registration_number, a.full_name, r.status, r.created_at
         FROM registrations r
         JOIN attendees a ON a.id = r.attendee_id
         ORDER BY r.created_at DESC
         LIMIT ${RECENT_ACTIVITY_LIMIT}`,
      ),
      getPool().query<{
        id: string;
        attendee_name: string;
        checkpoint_name: string;
        volunteer_name: string | null;
        completed_at: string;
      }>(
        `SELECT ca.id, a.full_name AS attendee_name, c.name AS checkpoint_name, v.name AS volunteer_name, ca.completed_at
         FROM checkpoint_attendance ca
         JOIN attendees a ON a.id = ca.attendee_id
         JOIN checkpoints c ON c.id = ca.checkpoint_id
         LEFT JOIN volunteers v ON v.id = ca.volunteer_id
         WHERE ca.status = 'COMPLETED'
         ORDER BY ca.completed_at DESC
         LIMIT ${RECENT_ACTIVITY_LIMIT}`,
      ),
    ]);

    const recentRegistrations: RecentRegistration[] = registrationsRows.rows.map((r) => ({
      id: r.id,
      registrationNumber: r.registration_number,
      fullName: r.full_name,
      status: r.status,
      createdAt: r.created_at,
    }));

    const recentCheckIns: RecentCheckIn[] = checkInsRows.rows.map((r) => ({
      id: r.id,
      attendeeName: r.attendee_name,
      checkpointName: r.checkpoint_name,
      volunteerName: r.volunteer_name,
      completedAt: r.completed_at,
    }));

    return { recentRegistrations, recentCheckIns };
  },
};
