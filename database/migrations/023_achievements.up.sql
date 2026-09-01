CREATE TABLE achievements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  description       TEXT,
  icon_url          TEXT,
  condition_type    TEXT NOT NULL DEFAULT 'MANUAL'
                       CHECK (condition_type IN ('CHECKPOINT_COUNT', 'SESSION_COUNT', 'FULL_ATTENDANCE', 'MANUAL')),
  condition_config  JSONB,
  display_order     INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'DRAFT'
                       CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX achievements_slug_unique ON achievements (slug);

CREATE TRIGGER trg_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
