ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_registration_number_unique;
DROP SEQUENCE IF EXISTS registration_number_seq;
