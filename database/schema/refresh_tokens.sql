-- Documentation copy — see database/migrations/035_refresh_tokens.up.sql for
-- the applied migration, which is the source of truth.
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX refresh_tokens_hash_unique ON refresh_tokens (token_hash);
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);
