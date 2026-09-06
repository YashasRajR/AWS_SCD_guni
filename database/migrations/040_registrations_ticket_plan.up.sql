-- Which ticket plan an attendee selected at registration time. Nullable so
-- existing rows (and the single-flat-fee era) don't need a backfill; the
-- registration service requires a valid, active plan for every new
-- registration going forward (see registrations.service.ts).
ALTER TABLE registrations ADD COLUMN ticket_plan_id UUID REFERENCES ticket_plans (id);
