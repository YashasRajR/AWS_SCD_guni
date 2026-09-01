-- AUTO-DOCUMENTED FROM database/migrations/022_certificates.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

-- Model + service boundary only in this phase — no PDF generation yet.
CREATE TABLE certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id         UUID NOT NULL REFERENCES attendees (id) ON DELETE CASCADE,
  certificate_number  TEXT NOT NULL,
  certificate_type    TEXT NOT NULL DEFAULT 'PARTICIPATION'
                         CHECK (certificate_type IN ('PARTICIPATION', 'SESSION', 'ACHIEVEMENT')),
  title               TEXT NOT NULL,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_url            TEXT,
  status              TEXT NOT NULL DEFAULT 'ISSUED'
                         CHECK (status IN ('ISSUED', 'REVOKED')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX certificates_certificate_number_unique ON certificates (certificate_number);
CREATE INDEX certificates_attendee_id_idx ON certificates (attendee_id);

CREATE TRIGGER trg_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
