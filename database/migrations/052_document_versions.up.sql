-- Document version history for tickets/invoices (spec #62): when an admin
-- regenerates a ticket or invoice PDF, the previous PDF is archived here
-- (with who/why/when) instead of being silently overwritten, and the
-- document's own `version` column is bumped. Ticket reissue already
-- rotates/revokes the old QR tokens (qr_tokens.issue()) so "only the
-- current version is scannable" was already true; this adds the missing
-- "preserve old version + record reason" half.
ALTER TABLE tickets ADD COLUMN version INT NOT NULL DEFAULT 1;
ALTER TABLE invoices ADD COLUMN version INT NOT NULL DEFAULT 1;

CREATE TABLE document_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('TICKET', 'INVOICE')),
  document_id   UUID NOT NULL,
  version       INT NOT NULL,
  pdf_data      BYTEA NOT NULL,
  reason        TEXT,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_type, document_id, version)
);

CREATE INDEX document_versions_lookup_idx ON document_versions (document_type, document_id);
