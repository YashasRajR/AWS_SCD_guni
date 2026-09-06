-- Photo gallery (spec section 9). `session_id` is an optional association
-- to a session (e.g. photos from that talk/workshop); `event_year`
-- captures which edition a photo belongs to without needing a full
-- multi-event data model yet (see gap-analysis "single-event assumption").
CREATE TABLE gallery_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url      TEXT NOT NULL,
  caption        TEXT,
  alt_text       TEXT,
  category       TEXT,
  event_year     INTEGER,
  session_id     UUID REFERENCES sessions(id) ON DELETE SET NULL,
  display_order  INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX gallery_items_category_idx ON gallery_items (category);
CREATE INDEX gallery_items_session_idx ON gallery_items (session_id);

CREATE TRIGGER trg_gallery_items_updated_at
  BEFORE UPDATE ON gallery_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
