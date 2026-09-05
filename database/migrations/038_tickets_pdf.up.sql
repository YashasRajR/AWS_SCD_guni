-- Generated ticket PDF (event details + both QR codes rendered as images),
-- built once at issuance time while the raw QR tokens are still known (a
-- raw token exists nowhere after that moment — see qr_tokens.token_hash).
-- Stored in-row as bytea: a ticket PDF is small (a single page with two
-- QR images) and this avoids standing up file storage for phase 1.
ALTER TABLE tickets
  ADD COLUMN pdf_data BYTEA,
  ADD COLUMN pdf_generated_at TIMESTAMPTZ;
