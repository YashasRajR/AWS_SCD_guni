-- Refresh tokens: enables silent session renewal (see backend/src/modules/auth)
-- instead of a flat 15-minute-then-logout access token. Stored hashed, never
-- in plaintext, same pattern as password_reset_tokens/email_verification_tokens
-- (migration 029). Rotated on every use (the old row is revoked, a new one
-- issued) and fully revoked on logout or password reset.
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
