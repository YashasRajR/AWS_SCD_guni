-- Ticket Pricing & Plans checklist: exact plan titles and a short
-- "who it's for" description, sourced from copy this app already used as
-- a client-side fallback (see RegisterPage.tsx before this change) --
-- now the real, admin-editable field instead of a hardcoded string.
UPDATE ticket_plans SET name = 'Professional / Adult' WHERE code = 'PROFESSIONAL' AND name = 'Professional';

UPDATE ticket_plans SET description = 'For currently enrolled college/university students.'
  WHERE code = 'STUDENT' AND description IS NULL;
UPDATE ticket_plans SET description = 'For working professionals and other adult attendees.'
  WHERE code = 'PROFESSIONAL' AND description IS NULL;
