UPDATE ticket_plans SET name = 'Professional' WHERE code = 'PROFESSIONAL' AND name = 'Professional / Adult';

UPDATE ticket_plans SET description = NULL
  WHERE code = 'STUDENT' AND description = 'For currently enrolled college/university students.';
UPDATE ticket_plans SET description = NULL
  WHERE code = 'PROFESSIONAL' AND description = 'For working professionals and other adult attendees.';
