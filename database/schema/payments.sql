-- AUTO-DOCUMENTED FROM database/migrations/008_payments.up.sql,
-- 032_payments_provider_order_id.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id     UUID NOT NULL REFERENCES registrations (id) ON DELETE CASCADE,
  provider            TEXT,
  -- Known as soon as an order is created (before the payer has paid) —
  -- this is what the webhook payload correlates back to our row by.
  provider_order_id   TEXT,
  -- Only known once payment actually completes.
  provider_payment_id TEXT,
  amount              NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'INR',
  status              TEXT NOT NULL DEFAULT 'PENDING'
                         CHECK (status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED')),
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX payments_registration_id_idx ON payments (registration_id);
CREATE INDEX payments_status_idx ON payments (status);
CREATE UNIQUE INDEX payments_provider_order_id_unique
  ON payments (provider, provider_order_id)
  WHERE provider_order_id IS NOT NULL;
-- A given provider payment id should never be recorded twice.
CREATE UNIQUE INDEX payments_provider_payment_id_unique
  ON payments (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
