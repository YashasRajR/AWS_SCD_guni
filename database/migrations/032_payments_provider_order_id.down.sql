DROP INDEX IF EXISTS payments_provider_order_id_unique;
ALTER TABLE payments DROP COLUMN provider_order_id;
