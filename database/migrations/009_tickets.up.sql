-- DO NOT add QR or NFC fields to this table. Tickets are looked up and
-- displayed by registration/ticket number only.
CREATE TABLE tickets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  UUID NOT NULL REFERENCES registrations (id) ON DELETE CASCADE,
  ticket_number    TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'ISSUED'
                      CHECK (status IN ('ISSUED', 'REVOKED')),
  issued_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tickets_ticket_number_unique ON tickets (ticket_number);
CREATE UNIQUE INDEX tickets_registration_id_unique ON tickets (registration_id);

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
