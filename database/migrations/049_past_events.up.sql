-- Past-event archive cards (spec section 14: "visual glimpses rather than
-- full archival pages" -- so a flat card table, not a mirror of the full
-- events/sessions/speakers schema for each prior edition).
CREATE TABLE past_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name         TEXT NOT NULL,
  year               INTEGER NOT NULL,
  session_name       TEXT,
  session_image      TEXT,
  short_description  TEXT,
  event_date         DATE,
  location           TEXT,
  archive_url        TEXT,
  display_order      INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX past_events_year_idx ON past_events (year);

CREATE TRIGGER trg_past_events_updated_at
  BEFORE UPDATE ON past_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
