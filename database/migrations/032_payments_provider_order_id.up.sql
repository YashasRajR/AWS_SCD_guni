-- The provider's *order* id (created before the payer ever pays) is
-- distinct from provider_payment_id (only known once payment completes) —
-- the webhook payload correlates back to our row by order id, so it must
-- be stored the moment the order is created, not just at the end.
ALTER TABLE payments ADD COLUMN provider_order_id TEXT;

CREATE UNIQUE INDEX payments_provider_order_id_unique
  ON payments (provider, provider_order_id)
  WHERE provider_order_id IS NOT NULL;
