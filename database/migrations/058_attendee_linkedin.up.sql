-- Optional LinkedIn profile field for registration (spec #17). No CHECK
-- constraint on registration_type (added in 006) since admin edits to it
-- already accept free text -- this migration only adds the new column.
ALTER TABLE attendees ADD COLUMN linkedin_url TEXT;
