-- AUTO-DOCUMENTED FROM database/migrations/013_venues.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

CREATE TABLE venues (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  location     TEXT,
  room         TEXT,
  capacity     INTEGER,
  map_url      TEXT,
  status       TEXT NOT NULL DEFAULT 'DRAFT'
                 CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX venues_event_id_idx ON venues (event_id);

CREATE TRIGGER trg_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
