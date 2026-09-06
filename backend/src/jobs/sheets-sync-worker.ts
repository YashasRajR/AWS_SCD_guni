import { sheetsSyncRepository } from '../modules/sheets-sync/sheets-sync.repository.js';
import { sheetsSyncService } from '../modules/sheets-sync/sheets-sync.service.js';
import { getSheetsProvider } from '../integrations/sheets/index.js';
import { logger } from '../utils/logger.js';

const POLL_INTERVAL_MS = 15_000;
const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 5;

/** attempt 1 -> 30s, 2 -> 1m, 3 -> 2m, 4 -> 4m, ... capped at 30m. Same
 * curve as the email worker. */
function backoffMs(attempts: number): number {
  return Math.min(30_000 * 2 ** (attempts - 1), 30 * 60_000);
}

/**
 * sheets_sync_queue is the outbox — no separate job runner, per the
 * "modular monolith, no unnecessary infrastructure" rule (see
 * email-worker.ts). Every unconfigured deployment still exercises this
 * loop; it just fails every row with SheetsProviderNotConfiguredError
 * until GOOGLE_SHEETS_* is set, at which point it starts succeeding with
 * no code change.
 */
async function processBatch(): Promise<void> {
  const due = await sheetsSyncRepository.listDue(BATCH_SIZE);
  for (const record of due) {
    try {
      const row = await sheetsSyncService.buildRow(record.entity_type, record.entity_id);
      if (!row) {
        // The underlying registration is gone — nothing left to sync.
        await sheetsSyncRepository.markSynced(record.id);
        continue;
      }
      await getSheetsProvider().appendRow(row);
      await sheetsSyncRepository.markSynced(record.id);
    } catch (err) {
      const attempts = record.attempts + 1;
      const reason = err instanceof Error ? err.message : String(err);
      logger.warn(
        { err, sheetsSyncQueueId: record.id, entityType: record.entity_type, attempts },
        'Sheets sync attempt failed',
      );
      await sheetsSyncRepository.markFailedAttempt(
        record.id,
        reason,
        attempts,
        MAX_ATTEMPTS,
        new Date(Date.now() + backoffMs(attempts)),
      );
    }
  }
}

export function startSheetsSyncWorker(): NodeJS.Timeout {
  const timer = setInterval(() => {
    processBatch().catch((err) => {
      logger.error({ err }, 'Sheets sync worker batch failed unexpectedly');
    });
  }, POLL_INTERVAL_MS);
  timer.unref();
  logger.info(`Sheets sync worker started (polling every ${POLL_INTERVAL_MS / 1000}s)`);
  return timer;
}

export function stopSheetsSyncWorker(timer: NodeJS.Timeout): void {
  clearInterval(timer);
}
