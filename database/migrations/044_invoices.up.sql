-- Invoice/fee-receipt PDFs -- one per payment, generated once the payment
-- is confirmed (see payments.service.ts's payment.captured handler),
-- alongside (but independent of) ticket issuance. Stored in-row as bytea,
-- same rationale as tickets.pdf_data (038_tickets_pdf): small, single-page,
-- no need for file storage in this phase.
CREATE TABLE invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id       UUID NOT NULL REFERENCES payments (id) ON DELETE CASCADE,
  registration_id  UUID NOT NULL REFERENCES registrations (id) ON DELETE CASCADE,
  invoice_number   TEXT NOT NULL,
  amount           NUMERIC(10, 2) NOT NULL,
  discount_amount  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  -- No GST/tax calculation is implemented yet -- always 0 for now; the
  -- column exists so a future tax rule doesn't need another migration.
  tax_amount       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'INR',
  pdf_data         BYTEA,
  generated_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX invoices_payment_id_unique ON invoices (payment_id);
CREATE UNIQUE INDEX invoices_invoice_number_unique ON invoices (invoice_number);
CREATE INDEX invoices_registration_id_idx ON invoices (registration_id);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
