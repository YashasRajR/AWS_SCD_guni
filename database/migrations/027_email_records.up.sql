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
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_records_status_idx ON email_records (status);
CREATE INDEX email_records_recipient_idx ON email_records (recipient);

CREATE TRIGGER trg_email_records_updated_at
  BEFORE UPDATE ON email_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
