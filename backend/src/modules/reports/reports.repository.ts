import { getPool } from '../../config/database.js';
import type { AdminDashboardSummary } from './reports.types.js';

async function count(sql: string): Promise<number> {
  const { rows } = await getPool().query<{ count: string }>(sql);
  return Number(rows[0]?.count ?? 0);
}

export const reportsRepository = {
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
