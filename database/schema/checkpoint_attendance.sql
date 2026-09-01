-- AUTO-DOCUMENTED FROM database/migrations/021_checkpoint_attendance.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

CREATE TABLE checkpoint_attendance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id   UUID NOT NULL REFERENCES attendees (id) ON DELETE CASCADE,
  checkpoint_id UUID NOT NULL REFERENCES checkpoints (id) ON DELETE CASCADE,
  volunteer_id  UUID REFERENCES volunteers (id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'COMPLETED'
                  CHECK (status IN ('COMPLETED', 'REVERSED')),
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX checkpoint_attendance_attendee_id_idx ON checkpoint_attendance (attendee_id);
CREATE INDEX checkpoint_attendance_checkpoint_id_idx ON checkpoint_attendance (checkpoint_id);

-- Prevent the same attendee completing the same checkpoint twice while the
-- record is COMPLETED. A REVERSED row (explicit admin override) does not
-- block a fresh completion.
CREATE UNIQUE INDEX checkpoint_attendance_unique_completed
  ON checkpoint_attendance (attendee_id, checkpoint_id)
  WHERE status = 'COMPLETED';

CREATE TRIGGER trg_checkpoint_attendance_updated_at
  BEFORE UPDATE ON checkpoint_attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
