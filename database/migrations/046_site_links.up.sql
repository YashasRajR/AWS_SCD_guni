-- Nav items and social links are structurally identical (label + url +
-- external/new-tab flags + display order + draft/published), so one table
-- with a `kind` discriminator serves both instead of two near-duplicate
-- tables/modules -- see backend/src/modules/site-links.
CREATE TABLE site_links (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind           TEXT NOT NULL CHECK (kind IN ('NAV', 'SOCIAL')),
  label          TEXT NOT NULL,
  url            TEXT NOT NULL,
  is_external    BOOLEAN NOT NULL DEFAULT false,
  open_new_tab   BOOLEAN NOT NULL DEFAULT false,
  display_order  INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX site_links_kind_order_idx ON site_links (kind, display_order);

CREATE TRIGGER trg_site_links_updated_at
  BEFORE UPDATE ON site_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
