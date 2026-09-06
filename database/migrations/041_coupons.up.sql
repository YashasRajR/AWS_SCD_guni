CREATE TABLE coupons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL,
  name                TEXT,
  discount_type       TEXT NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
  discount_value       NUMERIC(10, 2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  starts_at           TIMESTAMPTZ,
  ends_at             TIMESTAMPTZ,
  max_uses            INTEGER,
  per_user_limit      INTEGER NOT NULL DEFAULT 1,
  ticket_plan_id      UUID REFERENCES ticket_plans (id),
  min_order_amount    NUMERIC(10, 2),
  max_discount_amount NUMERIC(10, 2),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX coupons_code_unique ON coupons (UPPER(code));

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
