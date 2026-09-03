DROP INDEX IF EXISTS email_records_due_idx;

ALTER TABLE email_records
  DROP COLUMN IF EXISTS data,
  DROP COLUMN IF EXISTS attempts,
  DROP COLUMN IF EXISTS next_attempt_at;
