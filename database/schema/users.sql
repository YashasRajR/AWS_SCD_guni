-- AUTO-DOCUMENTED FROM database/migrations/001_extensions_and_users.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

-- Extensions -----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gives us gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;   -- case-insensitive email column

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
