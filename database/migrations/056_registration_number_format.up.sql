-- Sequential registration ID format (spec #20): "GUNI AWS SCD <YY> <NNN>",
-- e.g. "GUNI AWS SCD 26 001" through "...999". A native sequence gives us
-- every property the spec asks for for free: atomic/concurrency-safe
-- (nextval() is a single atomic DB op, no read-then-write race), never
-- reused (sequences don't roll back on delete or even on a failed
-- transaction), and hard-capped at 999 (MAXVALUE makes nextval() raise
-- once exhausted, rather than silently wrapping or colliding).
--
-- ponytail: one sequence total, not one per event year -- this repo
-- already assumes a single live event (see events table); move to a
-- per-year sequence alongside real multi-event support (spec #67) if
-- that's ever built.
CREATE SEQUENCE registration_number_seq AS INTEGER MAXVALUE 999 NO CYCLE START 1;

ALTER TABLE registrations ADD CONSTRAINT registrations_registration_number_unique UNIQUE (registration_number);
