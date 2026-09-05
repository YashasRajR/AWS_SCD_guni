ALTER TABLE tickets
  DROP COLUMN IF EXISTS pdf_data,
  DROP COLUMN IF EXISTS pdf_generated_at;
