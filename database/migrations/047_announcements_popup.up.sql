-- Turns the existing scheduled-announcement list into the spec's popup
-- system (section 40) by adding fields, rather than a separate table --
-- publish_at/expires_at/priority/status already cover "start/end date",
-- "priority", and "active/inactive" (admin can instantly disable an
-- emergency announcement by setting status to DRAFT/ARCHIVED).
ALTER TABLE announcements ADD COLUMN image_url TEXT;
ALTER TABLE announcements ADD COLUMN button_label TEXT;
ALTER TABLE announcements ADD COLUMN button_url TEXT;
ALTER TABLE announcements ADD COLUMN show_as_popup BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE announcements ADD COLUMN display_frequency TEXT NOT NULL DEFAULT 'EVERY_VISIT'
  CHECK (display_frequency IN ('ONCE', 'EVERY_VISIT', 'UNTIL_DISMISSED'));
-- Free-form values are 'ALL' (default), 'ATTENDEE', or 'GUEST' -- filtered
-- client-side against the viewer's own signed-in status, since this is a
-- public unauthenticated endpoint with no other notion of "audience".
ALTER TABLE announcements ADD COLUMN target_audience TEXT NOT NULL DEFAULT 'ALL';
