-- Recreates checkpoints/volunteers/volunteer_checkpoint_assignments/
-- checkpoint_attendance/qr_scan_logs exactly as they stood across
-- migrations 018, 019, 020, 021, 037 -- reversing this migration restores
-- the schema, not any data that existed before it ran.
CREATE TABLE checkpoints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  location      TEXT,
  start_time    TIMESTAMPTZ,
  end_time      TIMESTAMPTZ,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_required   BOOLEAN NOT NULL DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'PUBLISHED'
                   CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX checkpoints_event_id_idx ON checkpoints (event_id);
CREATE UNIQUE INDEX checkpoints_event_id_name_unique ON checkpoints (event_id, name);

CREATE TRIGGER trg_checkpoints_updated_at
  BEFORE UPDATE ON checkpoints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE volunteers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT,
  status     TEXT NOT NULL DEFAULT 'ACTIVE'
               CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX volunteers_user_id_unique ON volunteers (user_id);

CREATE TRIGGER trg_volunteers_updated_at
  BEFORE UPDATE ON volunteers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE volunteer_checkpoint_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id  UUID NOT NULL REFERENCES volunteers (id) ON DELETE CASCADE,
  checkpoint_id UUID NOT NULL REFERENCES checkpoints (id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'REVOKED'))
);

CREATE INDEX vca_volunteer_id_idx ON volunteer_checkpoint_assignments (volunteer_id);
CREATE INDEX vca_checkpoint_id_idx ON volunteer_checkpoint_assignments (checkpoint_id);
CREATE UNIQUE INDEX vca_active_unique
  ON volunteer_checkpoint_assignments (volunteer_id, checkpoint_id)
  WHERE status = 'ACTIVE';

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
CREATE UNIQUE INDEX checkpoint_attendance_unique_completed
  ON checkpoint_attendance (attendee_id, checkpoint_id)
  WHERE status = 'COMPLETED';

CREATE TRIGGER trg_checkpoint_attendance_updated_at
  BEFORE UPDATE ON checkpoint_attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE qr_scan_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_token_id   UUID REFERENCES qr_tokens (id) ON DELETE SET NULL,
  type          TEXT NOT NULL CHECK (type IN ('REGISTRATION', 'GOODIE')),
  volunteer_id  UUID REFERENCES volunteers (id) ON DELETE SET NULL,
  checkpoint_id UUID REFERENCES checkpoints (id) ON DELETE SET NULL,
  attendee_id   UUID REFERENCES attendees (id) ON DELETE SET NULL,
  result        TEXT NOT NULL CHECK (
                  result IN ('SUCCESS', 'ALREADY_USED', 'INVALID', 'REVOKED', 'CHECKPOINT_INACTIVE', 'NOT_ASSIGNED')
                ),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX qr_scan_logs_qr_token_id_idx ON qr_scan_logs (qr_token_id);
CREATE INDEX qr_scan_logs_created_at_idx ON qr_scan_logs (created_at DESC);
