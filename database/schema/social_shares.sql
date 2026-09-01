-- AUTO-DOCUMENTED FROM database/migrations/026_social_shares.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

-- Never store social-media passwords or tokens here — this table only
-- records that a share happened, for the attendee's own history.
CREATE TABLE social_shares (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id   UUID NOT NULL REFERENCES attendees (id) ON DELETE CASCADE,
  event_id      UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  platform      TEXT NOT NULL CHECK (platform IN ('LINKEDIN', 'INSTAGRAM')),
  content_type  TEXT NOT NULL CHECK (content_type IN ('CERTIFICATE', 'ACHIEVEMENT', 'EVENT_WRAPPED')),
  shared_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX social_shares_attendee_id_idx ON social_shares (attendee_id);
