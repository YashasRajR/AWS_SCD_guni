-- Persists every payment webhook delivery so duplicate deliveries are
-- rejected at the database layer (unique on provider + provider_event_id),
-- not only inferred from the payment row's current status. Complements —
-- does not replace — the existing payments_provider_order_id_unique /
-- payments_provider_payment_id_unique constraints: this table is the
-- record of "did we already see this exact webhook event", theirs is
-- "does this order/payment id already belong to a different row".
CREATE TABLE payment_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider           TEXT NOT NULL,
  -- The provider's own id for this webhook delivery when it supplies one;
  -- otherwise a deterministic key derived from the payload (event type +
  -- order/payment id) so a byte-for-byte retried delivery still collides
  -- with the first. Never null — always populated by the caller.
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
