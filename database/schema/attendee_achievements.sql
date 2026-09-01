-- AUTO-DOCUMENTED FROM database/migrations/024_attendee_achievements.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

CREATE TABLE attendee_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id    UUID NOT NULL REFERENCES attendees (id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX attendee_achievements_unique ON attendee_achievements (attendee_id, achievement_id);
