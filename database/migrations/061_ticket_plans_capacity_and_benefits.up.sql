-- Ticket Pricing & Plans checklist: an optional per-plan capacity (NULL =
-- unlimited, admin-set only -- never a fake default) and a list of
-- included benefits/items to show on the pricing card.
ALTER TABLE ticket_plans ADD COLUMN capacity INTEGER;
ALTER TABLE ticket_plans ADD COLUMN benefits TEXT[] NOT NULL DEFAULT '{}';
