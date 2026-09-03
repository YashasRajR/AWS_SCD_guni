# Authentication

Short-lived JWT access tokens (`AUTH_TOKEN_TTL`, 15m by default) plus a
DB-backed, rotating refresh token (`AUTH_REFRESH_TOKEN_TTL`, 30d by
default) — not a purely stateless JWT-only design. The access token stays
stateless (no DB round-trip to verify one); the refresh token is the one
piece of real server-side session state, stored hashed in the
`refresh_tokens` table (migration 035).

## Flow

1. `POST /api/v1/auth/register` — creates a `users` row (bcrypt-hashed
   password, 12 rounds) and an `attendees` profile row, assigns the
   `ATTENDEE` role, records an `email-verification` intent in
   `email_records` (not actually sent yet — see the root README's "what's
   modeled but not built" list), and returns an access+refresh token pair.
2. `POST /api/v1/auth/login` — verifies the password with `bcrypt.compare`,
   rejects with a generic `INVALID_CREDENTIALS` either way (never reveals
   whether the email exists), and returns a fresh access+refresh token
   pair whose access token payload embeds the user's current roles and
   permissions.
3. `POST /api/v1/auth/refresh` — exchanges a valid, unexpired, unrevoked
   refresh token for a new access+refresh pair. **Rotates on every use**:
   the presented token is revoked and a new one issued, so a refresh token
   is single-use — reusing an already-exchanged one is rejected the same
   as an unknown one. Roles/permissions are re-read from the database on
   every refresh, so a permission change an admin makes takes effect on
   the affected user's next silent refresh (at most `AUTH_TOKEN_TTL`
   later), not only on their next full login.
4. `POST /api/v1/auth/logout` — revokes the presented refresh token (real
   revocation, not a no-op). Deliberately does not require a still-valid
   access token — logging out is exactly the situation an expired access
   token can't gate. The already-issued access token itself is still a
   stateless JWT and remains valid until it naturally expires (at most
   `AUTH_TOKEN_TTL`); there is still no access-token denylist, an accepted
   tradeoff at this scale.
5. `POST /api/v1/auth/forgot-password` / `reset-password` — issues a
   single-use, sha256-hashed token in `password_reset_tokens` with a TTL
   (`PASSWORD_RESET_TOKEN_TTL`); the endpoint's response is identical
   whether or not the email exists. A successful reset also revokes every
   outstanding refresh token for that user (`revokeAllRefreshTokensForUser`)
   — a password reset can mean the old password was compromised, so every
   existing session is force-ended, not just future logins blocked.
6. `POST /api/v1/auth/verify-email` — same single-use hashed-token pattern
   via `email_verification_tokens`.

## Token contents

The access token payload (`AccessTokenPayload` in
`backend/src/modules/auth/auth.types.ts`) carries `sub` (user id), `email`,
`roles`, and `permissions` — resolved fresh at login/register/refresh time
via `usersRepository.getIdentitySnapshot`. Combined with the short access
token TTL and refresh rotation above, a role/permission change now
propagates within one refresh cycle rather than requiring a full re-login.

## Frontend refresh wiring

`@scd/api-client`'s `ApiClient` accepts `getRefreshToken`/`onTokenRefreshed`
options; on a 401 it transparently calls `POST /auth/refresh` once
(de-duplicated across concurrent in-flight requests via a shared promise),
persists the rotated pair through the callback, and retries the original
request — falling through to `onUnauthorized` only if the refresh itself
fails. All three apps (`apps/web`, `apps/volunteer`, `apps/admin`) store
both tokens in `localStorage` (separate keys per app) and wire this up in
their `src/lib/api.ts`.

## What's never sent to the client

`password_hash` never appears in any API response — `toPublicUser()` in
`backend/src/modules/users/users.types.ts` is the only place a `users` row
becomes API-shaped, and it does not include it. `AUTH_SECRET` and all
provider keys stay backend-only (see `packages/config` vs. the backend's
own `config/env.ts`).
