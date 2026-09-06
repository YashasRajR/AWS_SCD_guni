import { access, constants as fsConstants } from 'node:fs/promises';
import { checkDatabaseConnection, getPool } from '../../config/database.js';
import { getEnv } from '../../config/env.js';
import { resolveUploadDir } from '../../integrations/storage/local-storage.js';
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
    const [databaseOk, storageOk, queueDepth, sheetsQueueDepth] = await Promise.all([
      checkDatabaseConnection(),
      access(resolveUploadDir(), fsConstants.W_OK)
        .then(() => true)
        .catch(() => false),
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

    const paymentConfigured = Boolean(env.PAYMENT_PROVIDER_KEY && env.PAYMENT_PROVIDER_SECRET);
    const paymentGateway: IntegrationStatus = {
      name: paymentConfigured ? 'Razorpay' : 'Payment gateway',
      configured: paymentConfigured,
      status: paymentConfigured ? 'ok' : 'error',
      detail: paymentConfigured
        ? 'Configured — checkout accepts real payments.'
        : 'PAYMENT_PROVIDER_KEY/SECRET not set — checkout is refused.',
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

    const storage: IntegrationStatus = {
      name: 'Local disk',
      configured: true,
      status: storageOk ? 'ok' : 'error',
      detail: storageOk ? `Writable: ${resolveUploadDir()}` : 'Upload directory is not writable.',
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

    return { database, paymentGateway, email, storage, sheetsSync };
  },
};
