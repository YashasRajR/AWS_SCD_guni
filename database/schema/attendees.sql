-- AUTO-DOCUMENTED FROM database/migrations/006_attendees.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

CREATE TABLE attendees (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  phone             TEXT,
  university        TEXT,
  department        TEXT,
  year              TEXT,
  profile_image     TEXT,
  registration_type TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One attendee profile per user account.
CREATE UNIQUE INDEX attendees_user_id_unique ON attendees (user_id);

CREATE TRIGGER trg_attendees_updated_at
  BEFORE UPDATE ON attendees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
