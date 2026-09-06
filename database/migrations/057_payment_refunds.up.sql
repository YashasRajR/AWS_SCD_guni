-- Admin refund/manual-reconciliation support (spec #36). REFUNDED has been
-- a valid payments.status value since migration 008; this just gives it
-- somewhere to record what actually happened, so "View refund" has real
-- data instead of only a status label.
ALTER TABLE payments ADD COLUMN refunded_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN refund_amount NUMERIC(10, 2);
-- Set only for a gateway-initiated refund; a manual reconciliation (e.g.
-- refunded by bank transfer outside Razorpay) leaves this NULL -- the
-- audit_logs entry the action already requires is the record for that case.
ALTER TABLE payments ADD COLUMN refund_provider_id TEXT;
