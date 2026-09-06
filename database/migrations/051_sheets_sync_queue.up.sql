-- Google Sheets sync queue (spec #41). Same outbox/worker shape as
-- email_records: enqueue at the point something changes, an in-process
-- poller (sheets-sync-worker.ts) picks up due rows and calls the
-- configured SheetsProvider, retrying with backoff on failure. Only
-- REGISTRATION is synced today (the natural "live registrations sheet
-- for finance/organizers" use case); entity_type is a CHECK-constrained
-- column, not a free-for-all, so adding a second synced entity later is
-- a migration, not a silent behavior change.
CREATE TABLE sheets_sync_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('REGISTRATION')),
  entity_id       UUID NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'RETRYING', 'SYNCED', 'FAILED')),
  attempts        INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error      TEXT,
  synced_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sheets_sync_queue_due_idx
  ON sheets_sync_queue (next_attempt_at)
  WHERE status IN ('PENDING', 'RETRYING');

CREATE TRIGGER trg_sheets_sync_queue_updated_at
  BEFORE UPDATE ON sheets_sync_queue
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
