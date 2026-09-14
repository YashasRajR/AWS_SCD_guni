-- Recreates the payments/payment_events/invoices tables exactly as they
-- stood across migrations 008, 032, 036, 044, 050, 057 (their combined
-- final shape) -- reversing this migration restores the schema, not any
-- data that existed before it ran.
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id     UUID NOT NULL REFERENCES registrations (id) ON DELETE CASCADE,
  provider            TEXT,
  provider_payment_id TEXT,
  provider_order_id   TEXT,
  amount              NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'INR',
  status              TEXT NOT NULL DEFAULT 'PENDING'
                         CHECK (status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED')),
  paid_at             TIMESTAMPTZ,
  refunded_at         TIMESTAMPTZ,
  refund_amount       NUMERIC(10, 2),
  refund_provider_id  TEXT,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX payments_registration_id_idx ON payments (registration_id);
CREATE INDEX payments_status_idx ON payments (status);
CREATE INDEX payments_active_idx ON payments (id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX payments_provider_payment_id_unique
  ON payments (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;
CREATE UNIQUE INDEX payments_provider_order_id_unique
  ON payments (provider, provider_order_id)
  WHERE provider_order_id IS NOT NULL;

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE payment_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider           TEXT NOT NULL,
  provider_event_id  TEXT NOT NULL,
  event_type         TEXT NOT NULL,
  payment_id         UUID REFERENCES payments (id) ON DELETE SET NULL,
  received_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at       TIMESTAMPTZ,
  processing_status  TEXT NOT NULL DEFAULT 'RECEIVED'
                        CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'IGNORED', 'ERROR')),
  error_message      TEXT,
  metadata           JSONB
);

CREATE UNIQUE INDEX payment_events_provider_event_unique
  ON payment_events (provider, provider_event_id);
CREATE INDEX payment_events_payment_id_idx ON payment_events (payment_id);
CREATE INDEX payment_events_received_at_idx ON payment_events (received_at);

CREATE TABLE invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id       UUID NOT NULL REFERENCES payments (id) ON DELETE CASCADE,
  registration_id  UUID NOT NULL REFERENCES registrations (id) ON DELETE CASCADE,
  invoice_number   TEXT NOT NULL,
  amount           NUMERIC(10, 2) NOT NULL,
  discount_amount  NUMERIC(10, 2) NOT NULL DEFAULT 0,
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
