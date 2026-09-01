-- AUTO-DOCUMENTED FROM database/migrations/017_announcements.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'NORMAL'
                CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  publish_at  TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'DRAFT'
                CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX announcements_status_idx ON announcements (status);

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
