-- Lets an admin set the exact copy shown on the public registration CTA
-- once registration has closed, instead of the frontend hardcoding one
-- fixed sentence for every event edition. NULL falls back to a generic
-- "Registration for this phase is closed." message.
ALTER TABLE events
  ADD COLUMN registration_closed_message TEXT;
