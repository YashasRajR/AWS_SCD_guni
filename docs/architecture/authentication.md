# Authentication

Stateless JWT, no server-side session store.

## Flow

1. `POST /api/v1/auth/register` — creates a `users` row (bcrypt-hashed
   password, 12 rounds) and an `attendees` profile row, assigns the
   `ATTENDEE` role, records an `email-verification` intent in
   `email_records` (not actually sent yet — see the root README's "what's
   modeled but not built" list), and returns an access token.
2. `POST /api/v1/auth/login` — verifies the password with `bcrypt.compare`,
   rejects with a generic `INVALID_CREDENTIALS` either way (never reveals
   whether the email exists), and returns a fresh access token whose
   payload embeds the user's current roles and permissions.
3. `POST /api/v1/auth/logout` — a documented no-op: there is nothing to
   invalidate server-side for a stateless JWT. The client discards its
   token.
4. `POST /api/v1/auth/forgot-password` / `reset-password` — issues a
   single-use, sha256-hashed token in `password_reset_tokens` with a TTL
   (`PASSWORD_RESET_TOKEN_TTL`); the endpoint's response is identical
   whether or not the email exists.
5. `POST /api/v1/auth/verify-email` — same single-use hashed-token pattern
   via `email_verification_tokens`.

## Token contents

The access token payload (`AccessTokenPayload` in
`backend/src/modules/auth/auth.types.ts`) carries `sub` (user id), `email`,
`roles`, and `permissions` — resolved once at login/register time via
`usersRepository.getIdentitySnapshot`. This means a role or permission
change takes effect the next time the affected user logs in, not
instantly. That trade-off keeps every authenticated request to a single
JWT verification with no database round-trip; revisit it (e.g. a short
token TTL plus refresh, or a per-request permission re-check) if
near-instant permission revocation becomes a requirement.

## What's never sent to the client

`password_hash` never appears in any API response — `toPublicUser()` in
`backend/src/modules/users/users.types.ts` is the only place a `users` row
becomes API-shaped, and it does not include it. `AUTH_SECRET` and all
provider keys stay backend-only (see `packages/config` vs. the backend's
own `config/env.ts`).
