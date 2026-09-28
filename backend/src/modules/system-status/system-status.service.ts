import { checkDatabaseConnection, getPool } from '../../config/database.js';
import { getEnv } from '../../config/env.js';
import type { IntegrationStatus, SystemStatus } from './system-status.types.js';

/**
 * Per-integration status for the admin dashboard (spec #52) — the
 * existing /health and /ready probes only cover process liveness and the
 * database, not the individual integrations an admin actually cares
 * about day to day. Each check reuses the same env/config each
 * integration's own module already reads to pick a provider, so this
 * never drifts from what's actually wired up.
 */
export const systemStatusService = {
  async getStatus(): Promise<SystemStatus> {
    const env = getEnv();
    const [databaseOk, queueDepth, sheetsQueueDepth] = await Promise.all([
      checkDatabaseConnection(),
      getPool()
        .query<{ count: string }>(
          `SELECT count(*)::text AS count FROM email_records WHERE status IN ('PENDING', 'RETRYING')`,
        )
        .then((r) => Number(r.rows[0]?.count ?? 0)),
      getPool()
        .query<{ count: string }>(
          `SELECT count(*)::text AS count FROM sheets_sync_queue WHERE status IN ('PENDING', 'RETRYING')`,
        )
        .then((r) => Number(r.rows[0]?.count ?? 0)),
    ]);

    const database: IntegrationStatus = {
      name: 'PostgreSQL',
      configured: true,
      status: databaseOk ? 'ok' : 'error',
      detail: databaseOk ? 'Connected' : 'Connection failed',
    };

    const emailConfigured = Boolean(env.EMAIL_SMTP_HOST);
    const email: IntegrationStatus & { queueDepth: number } = {
      name: emailConfigured ? 'SMTP' : 'Console (dev fallback)',
      configured: emailConfigured,
      status: emailConfigured ? 'ok' : 'error',
      detail: emailConfigured
        ? `Sending via ${env.EMAIL_SMTP_HOST}.`
        : 'EMAIL_SMTP_HOST not set — emails are logged, not delivered.',
      queueDepth,
    };

    // Uploads are stored as Postgres blobs (see integrations/storage/db-storage.ts),
    // so storage health is just database health -- no separate disk check.
    const storage: IntegrationStatus = {
      name: 'Postgres (uploads table)',
      configured: true,
      status: databaseOk ? 'ok' : 'error',
      detail: databaseOk ? 'Connected' : 'Connection failed',
    };

    const sheetsConfigured = Boolean(
      env.GOOGLE_SHEETS_SPREADSHEET_ID &&
        env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL &&
        env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY,
    );
    const sheetsSync: IntegrationStatus & { queueDepth: number } = {
      name: 'Google Sheets',
      configured: sheetsConfigured,
      status: sheetsConfigured ? 'ok' : 'error',
      detail: sheetsConfigured
        ? `Syncing to spreadsheet ${env.GOOGLE_SHEETS_SPREADSHEET_ID}.`
        : 'GOOGLE_SHEETS_* not set — sync rows queue up but never send.',
      queueDepth: sheetsQueueDepth,
    };

    return { database, email, storage, sheetsSync };
  },
};
