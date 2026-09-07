-- Extra registration-form fields (spec #17 follow-up): branch and date of
-- birth for students, company name and designation for employees. All
-- nullable -- which fields apply depends on registration_type, enforced in
-- the Zod schema, not a DB constraint (same approach as registration_type
-- itself, see 006_attendees).
ALTER TABLE attendees ADD COLUMN branch TEXT;
ALTER TABLE attendees ADD COLUMN date_of_birth DATE;
ALTER TABLE attendees ADD COLUMN company_name TEXT;
ALTER TABLE attendees ADD COLUMN designation TEXT;
