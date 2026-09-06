-- About/AWS Section CMS (spec #6) -- an admin-editable, orderable list of
-- content blocks (what AWS is, what the community represents, etc.),
-- same shape as gallery_items/announcements: title/body + optional image
-- and link, display_order, DRAFT/PUBLISHED/ARCHIVED status.
CREATE TABLE about_sections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  image_url      TEXT,
  link_url       TEXT,
  link_label     TEXT,
  display_order  INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX about_sections_status_idx ON about_sections (status);

CREATE TRIGGER trg_about_sections_updated_at
  BEFORE UPDATE ON about_sections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
