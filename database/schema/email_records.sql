-- AUTO-DOCUMENTED FROM database/migrations/027_email_records.up.sql and
-- 030_email_records_delivery_fields.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

CREATE TABLE email_records (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users (id) ON DELETE SET NULL,
  recipient            TEXT NOT NULL,
  template             TEXT NOT NULL,
  subject              TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'RETRYING')),
  provider_message_id  TEXT,
  sent_at              TIMESTAMPTZ,
  failure_reason       TEXT,
  data                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempts             INT NOT NULL DEFAULT 0,
  next_attempt_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_records_status_idx ON email_records (status);
CREATE INDEX email_records_recipient_idx ON email_records (recipient);
CREATE INDEX email_records_due_idx ON email_records (next_attempt_at)
  WHERE status IN ('PENDING', 'RETRYING');

CREATE TRIGGER trg_email_records_updated_at
  BEFORE UPDATE ON email_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
