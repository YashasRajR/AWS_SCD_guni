CREATE TABLE agenda_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  session_id     UUID REFERENCES sessions (id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  start_time     TIMESTAMPTZ NOT NULL,
  end_time       TIMESTAMPTZ NOT NULL,
  venue_id       UUID REFERENCES venues (id) ON DELETE SET NULL,
  display_order  INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX agenda_items_event_id_idx ON agenda_items (event_id);
CREATE INDEX agenda_items_start_time_idx ON agenda_items (start_time);

CREATE TRIGGER trg_agenda_items_updated_at
  BEFORE UPDATE ON agenda_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
