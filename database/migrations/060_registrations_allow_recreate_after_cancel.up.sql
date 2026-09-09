-- 033 made "one registration per attendee, ever" a hard DB constraint to
-- close a race the app-level check-then-insert couldn't. That's stricter
-- than intended: an attendee whose registration is CANCELLED (declined
-- payment attempt abandoned, admin-cancelled, etc.) can never register
-- again -- there's no path back into the event. Replace the plain unique
-- constraint with a partial unique index that only counts non-cancelled
-- rows, so create() can allow a fresh registration once the old one is
-- cancelled, while still blocking a genuine double-submit race.
ALTER TABLE registrations DROP CONSTRAINT registrations_attendee_id_unique;
CREATE UNIQUE INDEX registrations_attendee_id_unique ON registrations (attendee_id) WHERE status <> 'CANCELLED';
