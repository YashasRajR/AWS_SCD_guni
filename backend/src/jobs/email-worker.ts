import { emailsRepository } from '../modules/emails/emails.repository.js';
import { getEmailProvider } from '../integrations/email/index.js';
import { logger } from '../utils/logger.js';

const POLL_INTERVAL_MS = 10_000;
const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 5;

/** attempt 1 -> 30s, 2 -> 1m, 3 -> 2m, 4 -> 4m, ... capped at 30m. */
function backoffMs(attempts: number): number {
  return Math.min(30_000 * 2 ** (attempts - 1), 30 * 60_000);
}

/**
 * `email_records` itself is the outbox/queue — no Redis/BullMQ, per the
 * "prefer a clean modular monolith, no unnecessary infrastructure" rule.
 * This in-process interval poller picks up due rows, renders + sends
 * them, and records the outcome. Any single row failing to send is
 * caught and retried later; it never crashes the worker loop or the
 * process.
 */
async function processBatch(): Promise<void> {
  const due = await emailsRepository.listDue(BATCH_SIZE);
  for (const record of due) {
    try {
      const { providerMessageId } = await getEmailProvider().send({
        to: record.recipient,
        template: record.template,
        subject: record.subject,
        data: record.data,
      });
      await emailsRepository.markSent(record.id, providerMessageId);
    } catch (err) {
      const attempts = record.attempts + 1;
      const reason = err instanceof Error ? err.message : String(err);
      logger.warn(
        { err, emailRecordId: record.id, template: record.template, attempts },
        'Email send attempt failed',
      );
      await emailsRepository.markFailedAttempt(
        record.id,
        reason,
        attempts,
        MAX_ATTEMPTS,
        new Date(Date.now() + backoffMs(attempts)),
      );
    }
  }
}

export function startEmailWorker(): NodeJS.Timeout {
  const timer = setInterval(() => {
    processBatch().catch((err) => {
      logger.error({ err }, 'Email worker batch failed unexpectedly');
    });
  }, POLL_INTERVAL_MS);
  timer.unref();
  logger.info(`Email worker started (polling every ${POLL_INTERVAL_MS / 1000}s)`);
  return timer;
}

export function stopEmailWorker(timer: NodeJS.Timeout): void {
  clearInterval(timer);
}
