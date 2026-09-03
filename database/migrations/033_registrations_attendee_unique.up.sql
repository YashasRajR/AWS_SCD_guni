-- The service layer already enforces "one registration per attendee,
-- ever" (registrations.service.ts's create() rejects if any registration
-- already exists, regardless of status) — but that check-then-insert is
-- only safe against a single concurrent request. Two simultaneous
-- self-registration submits (e.g. a double-click, or two browser tabs)
-- can both pass the app-level check before either INSERT lands. This
-- constraint makes the database itself reject the second insert instead
-- of silently creating two rows for one attendee.
ALTER TABLE registrations ADD CONSTRAINT registrations_attendee_id_unique UNIQUE (attendee_id);
