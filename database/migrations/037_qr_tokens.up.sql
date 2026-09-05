-- QR check-in system (supersedes the earlier "no QR/NFC" decision — see
-- tickets.repository.ts). Two token types per ticket: REGISTRATION (gate
-- entry / general check-in) and GOODIE (goodie-bag claim). Tokens are
-- opaque and random; only a SHA-256 hash is ever persisted, so a leaked
-- database dump cannot be used to forge a scan. The raw token is returned
-- to the caller once, at issue time, and never stored or logged again.
CREATE TABLE qr_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('REGISTRATION', 'GOODIE')),
  token_hash  TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX qr_tokens_ticket_id_idx ON qr_tokens (ticket_id);

-- Rotation model: revoking the old ACTIVE row before inserting the new one
-- is what makes "at most one active token per ticket per type" hold; this
-- index is the database-level backstop against a race doing that badly.
CREATE UNIQUE INDEX qr_tokens_unique_active
  ON qr_tokens (ticket_id, type)
  WHERE status = 'ACTIVE';

CREATE TRIGGER trg_qr_tokens_updated_at
  BEFORE UPDATE ON qr_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Append-only log of every scan attempt, successful or not (spec requires
-- scan logging for QR tokens). qr_token_id is nullable because a scan of a
-- garbage/unknown token still needs to be logged and has no matching row.
CREATE TABLE qr_scan_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_token_id   UUID REFERENCES qr_tokens (id) ON DELETE SET NULL,
  type          TEXT NOT NULL CHECK (type IN ('REGISTRATION', 'GOODIE')),
  volunteer_id  UUID REFERENCES volunteers (id) ON DELETE SET NULL,
  checkpoint_id UUID REFERENCES checkpoints (id) ON DELETE SET NULL,
  attendee_id   UUID REFERENCES attendees (id) ON DELETE SET NULL,
  result        TEXT NOT NULL CHECK (
                  result IN ('SUCCESS', 'ALREADY_USED', 'INVALID', 'REVOKED', 'CHECKPOINT_INACTIVE', 'NOT_ASSIGNED')
                ),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX qr_scan_logs_qr_token_id_idx ON qr_scan_logs (qr_token_id);
CREATE INDEX qr_scan_logs_created_at_idx ON qr_scan_logs (created_at DESC);
