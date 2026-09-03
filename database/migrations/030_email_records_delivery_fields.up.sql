-- Adds what the email worker needs to actually render and retry a send:
-- the template data (e.g. a verification token/link) was previously
-- discarded at enqueue time because there was nowhere to put it, and there
-- was no way to bound retries. Both are additive, backward-compatible
-- columns — existing rows default to an empty payload and zero attempts.
ALTER TABLE email_records
  ADD COLUMN data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- The worker polls for due PENDING/RETRYING rows; a partial index keeps
-- that query cheap regardless of how many SENT/FAILED rows accumulate.
CREATE INDEX email_records_due_idx
  ON email_records (next_attempt_at)
  WHERE status IN ('PENDING', 'RETRYING');
