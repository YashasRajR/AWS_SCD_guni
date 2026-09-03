-- certificates.service.ts's issue() already checks for an existing active
-- (attendee_id, certificate_type) certificate before inserting, but that
-- check-then-insert is not race-safe on its own (two concurrent admin
-- issue requests, or an issue request racing a re-issue). A partial
-- unique index — matching the WHERE status = 'ISSUED' pattern already
-- used by checkpoint_attendance — is the backstop: it blocks a second
-- ISSUED row for the same attendee+type while allowing a fresh issuance
-- after a REVOKED one.
CREATE UNIQUE INDEX certificates_attendee_type_issued_unique
  ON certificates (attendee_id, certificate_type)
  WHERE status = 'ISSUED';
