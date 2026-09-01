-- Checkpoints are pure data — Registration/Breakfast/Lunch/High Tea/Goodies
-- are seeded rows, not names hard-coded into application logic. Admins can
-- add more later via the checkpoints module without a code change.
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
