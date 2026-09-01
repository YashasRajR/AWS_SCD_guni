CREATE TABLE timeline_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  start_time     TIMESTAMPTZ NOT NULL,
  end_time       TIMESTAMPTZ,
  type           TEXT NOT NULL DEFAULT 'OTHER'
                    CHECK (type IN ('REGISTRATION', 'MEAL', 'SESSION', 'BREAK', 'NETWORKING', 'CLOSING', 'OTHER')),
  display_order  INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX timeline_items_event_id_idx ON timeline_items (event_id);

CREATE TRIGGER trg_timeline_items_updated_at
  BEFORE UPDATE ON timeline_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
