-- Registration pricing lives on the event itself so different editions can
-- charge different amounts (or nothing — 0 means a free event, and the
-- payment flow is simply never triggered for it).
ALTER TABLE events ADD COLUMN registration_fee NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN currency TEXT NOT NULL DEFAULT 'INR';
