DROP INDEX IF EXISTS payments_active_idx;
DROP INDEX IF EXISTS registrations_active_idx;
DROP INDEX IF EXISTS attendees_active_idx;
DROP INDEX IF EXISTS users_active_idx;

ALTER TABLE payments DROP COLUMN deleted_at;
ALTER TABLE registrations DROP COLUMN deleted_at;
ALTER TABLE attendees DROP COLUMN deleted_at;
ALTER TABLE users DROP COLUMN deleted_at;
