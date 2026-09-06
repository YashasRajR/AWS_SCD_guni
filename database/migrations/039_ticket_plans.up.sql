CREATE TABLE ticket_plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  price          NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'INR',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ticket_plans_code_unique ON ticket_plans (code);

CREATE TRIGGER trg_ticket_plans_updated_at
  BEFORE UPDATE ON ticket_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
