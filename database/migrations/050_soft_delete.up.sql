-- Soft delete (spec #55): financial/audit-relevant records should not be
-- casually hard-deleted. Adds deleted_at to the four tables the gap
-- analysis flags (attendees, registrations, payments, users). No admin
-- delete/restore endpoints exist yet for any of these (see #34, not yet
-- built) — this migration only makes the columns exist so that future
-- work has somewhere to store the archived state, and so every read
-- query written from today onward excludes soft-deleted rows.
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE attendees ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE registrations ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN deleted_at TIMESTAMPTZ;

-- Partial indexes only cover the common "active rows" case — a
-- soft-deleted row is rare enough not to need its own index.
CREATE INDEX users_active_idx ON users (id) WHERE deleted_at IS NULL;
CREATE INDEX attendees_active_idx ON attendees (id) WHERE deleted_at IS NULL;
CREATE INDEX registrations_active_idx ON registrations (id) WHERE deleted_at IS NULL;
CREATE INDEX payments_active_idx ON payments (id) WHERE deleted_at IS NULL;
