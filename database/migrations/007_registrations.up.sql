CREATE TABLE registrations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id          UUID NOT NULL REFERENCES attendees (id) ON DELETE CASCADE,
  registration_number  TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED', 'REJECTED')),
  registered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at         TIMESTAMPTZ,
  cancelled_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX registrations_registration_number_unique ON registrations (registration_number);
CREATE INDEX registrations_attendee_id_idx ON registrations (attendee_id);
CREATE INDEX registrations_status_idx ON registrations (status);

CREATE TRIGGER trg_registrations_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
