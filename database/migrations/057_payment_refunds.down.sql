ALTER TABLE payments DROP COLUMN IF EXISTS refund_provider_id;
ALTER TABLE payments DROP COLUMN IF EXISTS refund_amount;
ALTER TABLE payments DROP COLUMN IF EXISTS refunded_at;
