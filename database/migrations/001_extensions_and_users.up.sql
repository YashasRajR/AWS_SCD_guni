-- Extensions -----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gives us gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;   -- case-insensitive email column

-- Shared trigger: keep updated_at current on every UPDATE ---------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users ------------------------------------------------------------------
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             CITEXT NOT NULL,
  password_hash     TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_unique ON users (email);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
