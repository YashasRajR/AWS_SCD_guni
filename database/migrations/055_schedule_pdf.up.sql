-- Downloadable event schedule PDF (spec #12) -- one singleton row.
-- Generate/Regenerate builds it fresh from agenda+session+venue data;
-- "Replace manually" (is_manual boolean) lets an admin swap in a
-- hand-built file when the generated one genuinely isn't enough, without
-- losing the generated_at/published trail.
CREATE TABLE schedule_pdf (
  id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pdf_data      BYTEA,
  is_manual     BOOLEAN NOT NULL DEFAULT false,
  published     BOOLEAN NOT NULL DEFAULT false,
  generated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_schedule_pdf_updated_at
  BEFORE UPDATE ON schedule_pdf
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
