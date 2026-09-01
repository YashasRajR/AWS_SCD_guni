CREATE TABLE attendee_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id    UUID NOT NULL REFERENCES attendees (id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX attendee_achievements_unique ON attendee_achievements (attendee_id, achievement_id);
