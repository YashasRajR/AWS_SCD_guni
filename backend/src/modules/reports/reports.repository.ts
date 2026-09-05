import { getPool } from '../../config/database.js';
import type { AdminDashboardSummary, AdminDashboardTrends, DailyCount, StatusCount } from './reports.types.js';

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
      pendingPayments,
      paidPayments,
      checkpointCompletions,
      certificatesIssued,
      achievementsUnlocked,
      emailsSent,
      emailsFailed,
    ] = await Promise.all([
      count('SELECT count(*) FROM registrations'),
      count(`SELECT count(*) FROM registrations WHERE status = 'CONFIRMED'`),
      count(`SELECT count(*) FROM payments WHERE status = 'PENDING'`),
      count(`SELECT count(*) FROM payments WHERE status = 'PAID'`),
      count(`SELECT count(*) FROM checkpoint_attendance WHERE status = 'COMPLETED'`),
      count(`SELECT count(*) FROM certificates WHERE status = 'ISSUED'`),
      count('SELECT count(*) FROM attendee_achievements'),
      count(`SELECT count(*) FROM email_records WHERE status = 'SENT'`),
      count(`SELECT count(*) FROM email_records WHERE status = 'FAILED'`),
    ]);

    return {
      totalRegistrations,
      confirmedRegistrations,
      pendingPayments,
      paidPayments,
      checkpointCompletions,
      certificatesIssued,
      achievementsUnlocked,
      emailsSent,
      emailsFailed,
    };
  },
};
