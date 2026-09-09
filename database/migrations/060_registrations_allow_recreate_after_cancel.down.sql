DROP INDEX registrations_attendee_id_unique;
ALTER TABLE registrations ADD CONSTRAINT registrations_attendee_id_unique UNIQUE (attendee_id);
