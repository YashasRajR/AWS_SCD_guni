-- Additional optional registration-form fields (spec: "add suggested
-- fields to the form" -- college ID, group/club, experience, how they
-- heard about the event, t-shirt size, dietary needs, emergency contact).
-- All nullable/optional: none of these block registration.
ALTER TABLE attendees
  ADD COLUMN college_id TEXT,
  ADD COLUMN group_name TEXT,
  ADD COLUMN years_of_experience TEXT,
  ADD COLUMN how_heard TEXT,
  ADD COLUMN tshirt_size TEXT,
  ADD COLUMN dietary_preference TEXT,
  ADD COLUMN emergency_contact TEXT;
