CREATE TABLE sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  session_type      TEXT NOT NULL DEFAULT 'TALK'
                       CHECK (session_type IN ('KEYNOTE', 'TALK', 'WORKSHOP', 'PANEL', 'BREAK')),
  track             TEXT,
  duration_minutes  INTEGER,
  status            TEXT NOT NULL DEFAULT 'DRAFT'
                       CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sessions_status_idx ON sessions (status);
CREATE INDEX sessions_track_idx ON sessions (track);

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
