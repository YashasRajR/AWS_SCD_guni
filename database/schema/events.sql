-- AUTO-DOCUMENTED FROM database/migrations/005_events.up.sql,
-- 031_events_registration_fee.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

-- Centralized event configuration so "AWS Student Community Day" is data,
-- not a string baked into application code — future editions just add a row.
CREATE TABLE events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  slug               TEXT NOT NULL,
  description        TEXT,
  event_date         DATE NOT NULL,
  start_time         TIMESTAMPTZ,
  end_time           TIMESTAMPTZ,
  venue              TEXT,
  registration_open  TIMESTAMPTZ,
  registration_close TIMESTAMPTZ,
  status             TEXT NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  -- 0 = a free event; the payment flow is simply never triggered.
  registration_fee   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency           TEXT NOT NULL DEFAULT 'INR',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX events_slug_unique ON events (slug);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
