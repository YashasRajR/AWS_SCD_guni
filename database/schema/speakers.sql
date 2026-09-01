-- AUTO-DOCUMENTED FROM database/migrations/010_speakers.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

CREATE TABLE speakers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  designation    TEXT,
  organization   TEXT,
  bio            TEXT,
  profile_image  TEXT,
  linkedin_url   TEXT,
  website_url    TEXT,
  display_order  INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX speakers_display_order_idx ON speakers (display_order);
CREATE INDEX speakers_status_idx ON speakers (status);

CREATE TRIGGER trg_speakers_updated_at
  BEFORE UPDATE ON speakers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
