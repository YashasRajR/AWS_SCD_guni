-- AUTO-DOCUMENTED FROM database/migrations/025_event_wrapped.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

-- Structured statistics, not hard-coded text. The visual asset generator
-- is a later phase — this only stores the numbers behind it.
CREATE TABLE event_wrapped (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id   UUID NOT NULL REFERENCES attendees (id) ON DELETE CASCADE,
  event_id      UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  statistics    JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary       TEXT,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX event_wrapped_attendee_event_unique ON event_wrapped (attendee_id, event_id);

CREATE TRIGGER trg_event_wrapped_updated_at
  BEFORE UPDATE ON event_wrapped
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
