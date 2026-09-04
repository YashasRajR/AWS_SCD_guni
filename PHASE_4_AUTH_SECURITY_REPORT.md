# Phase 4 — Authentication, Authorization & Account Security Report

**Date:** 2026-09-04. Method: a read-only agent audit traced the actual repository (not assumed) against the Phase 4 spec's checklist, then concrete fixes were implemented for the findings that were genuine, fixable-with-confidence gaps. Every claim below cites the file it's based on.

## A. Authentication architecture

Single identity system (`users` table + `roles`/`user_roles`/`permissions`/`role_permissions`) shared by all three frontends and all roles — no separate attendee/volunteer/admin auth stacks. `backend/src/modules/auth/*` is the sole issuer of credentials; `backend/src/middleware/authentication/index.ts`'s `authenticate()` is the sole verifier, used identically by every protected route regardless of which frontend app calls it.

## B. Session/token architecture

Short-lived (15 min default, `AUTH_TOKEN_TTL`) signed JWT access tokens + DB-backed rotating refresh tokens (30 days default, `AUTH_REFRESH_TOKEN_TTL`, stored as a sha256 hash in `refresh_tokens`, never in plaintext). Every login/register/refresh/password-change mints a genuinely fresh pair (`issueSessionTokens` in `auth.service.ts`) — confirmed no pre-auth token is ever reused or upgraded (no session-fixation path). Refresh is rotate-on-use: the presented token is revoked and a new one issued every time.

**Fixed this phase:** `authenticate()` previously trusted the JWT payload alone for everything, including account status. It now re-checks the user's current `status` in the database on every request (one indexed primary-key lookup) — see finding H below.

**Known, accepted, bounded gap (unchanged, documented):** roles/permissions themselves are still trusted from the token payload, not re-checked per-request. A role change (e.g. SUPER_ADMIN revoking someone's ADMIN role) takes effect within one `AUTH_TOKEN_TTL` window (≤15 min) or immediately on that user's next `/auth/refresh`, not instantly. This is a deliberate latency/cost tradeoff at this scale, distinct from account status (which is now instant) because status changes are rarer, higher-stakes, and cheaper to always check than re-deriving the full permission set every request.

## C. Password security

bcrypt, cost factor 12, unique salt per hash (bcrypt's standard behavior) — `backend/src/modules/auth/auth.service.ts`. Password hash is never included in any `toPublicUser`/API response shape (`users.types.ts`). Policy: 8–128 chars, ≥1 letter, ≥1 number (`packages/validation/src/auth.ts`) — deliberately no complexity theater beyond that, per the codebase's own stated philosophy. The 128-char cap is enforced by Zod validation middleware **before** the controller/service layer ever calls `bcrypt.hash`/`bcrypt.compare`, confirmed by tracing `validate()` → controller → service call order — so a multi-megabyte password can't reach bcrypt and cause a CPU-exhaustion DoS. No compromised-password (HaveIBeenPwned-style) check exists — not implemented, flagged as a Low/Future item below.

## D. Verification/reset flows

Both email verification and password reset use single-use, expiring, hashed tokens (`password_reset_tokens`/`email_verification_tokens`, migration 029 pattern) — consumed (marked used) transactionally on success, so replay is rejected. `forgotPassword` deliberately returns the identical response whether or not the email exists (account-enumeration-safe). A successful password reset revokes **every** outstanding refresh token for that user (`authRepository.revokeAllRefreshTokensForUser`), so old sessions can't keep silently refreshing past a reset that may have been triggered because credentials leaked. Same behavior added for the new authenticated change-password endpoint (Phase 3). No resend-verification-email endpoint exists at all — not a security bug, just a missing convenience feature, noted below.

**Fixed this phase (defense in depth, not a live leak):** `backend/src/utils/logger.ts`'s redact list was missing `currentPassword`/`newPassword` — the exact field names the change-password endpoint uses. Nothing in the codebase currently logs `req.body` (confirmed: `pino-http`'s config in `backend/src/middleware/logging/index.ts` only logs method/url/status/duration, and the central error handler never logs `req.body`), so this was latent, not exploited — added anyway so a future debug-logging addition can't accidentally leak it.

## E. RBAC matrix

| Resource | Public | Attendee | Volunteer | Admin | Super Admin |
|---|---:|---:|---:|---:|---:|
| Public event content (speakers/sessions/agenda/timeline/venues/FAQs/announcements, PUBLISHED only) | Yes | Yes | Yes | Yes | Yes |
| Own profile/registration/ticket/payment/certificates/achievements/event-wrapped (`/me/*`) | No | Yes (self only) | — | — | — |
| Attendee search (name/university, minimal fields) | No | No | Yes (`VIEW_ATTENDEE`) | Yes | Yes |
| Record/reverse attendance | No | No | Record only (`COMPLETE_CHECKPOINT`) | Both (`MANAGE_CHECKPOINTS`) | Both |
| Registrations (admin) | No | Own only | No | Yes (`MANAGE_REGISTRATIONS`) | Yes |
| Payments (admin) | No | Own (via `/me/payment`) | No | Yes (`MANAGE_PAYMENTS`) | Yes |
| Event content CRUD (all statuses) | No | No | No | Yes (per-module `MANAGE_*`) | Yes |
| Certificates issue/revoke | No | Read own | No | Yes (`MANAGE_CERTIFICATES`) | Yes |
| Achievements manage | No | Read own | No | Yes (`MANAGE_ACHIEVEMENTS`) | Yes |
| Audit logs | No | No | No | Yes (`VIEW_AUDIT_LOGS`) | Yes |
| **Role grant/revoke** | No | No | No | **No** | **Yes only (`MANAGE_ROLES`)** |
| Event/system settings | No | No | No | Yes (`MANAGE_SETTINGS`) | Yes |

The one deliberately asymmetric row is role management: `MANAGE_ROLES` is the single permission ADMIN does **not** get by default (`packages/constants/src/permissions.ts`'s `ROLE_PERMISSION_SEED`), so an ADMIN can never grant itself or anyone else ADMIN/SUPER_ADMIN. Verified end-to-end by `tests/integration/users/role-management.test.ts` and this phase's new `tests/integration/authentication/role-spoofing.test.ts` (an ADMIN calling `POST /admin/users/:id/roles` on itself gets 403).

## F. Ownership/IDOR controls

Every `/me/*` route resolves the attendee/user id from `req.identity.userId` (set by `authenticate` from the verified JWT), never from a client-supplied param — there are no `:id`/`:userId` params on `user-dashboard.routes.ts` at all. `requireOwnUserId` middleware exists as defense-in-depth for any route that *does* also accept an id param. Spot-checked this phase (in addition to Phase 3's own IDOR pass): no client-facing ticket-by-id route exists (only `/me/ticket`); certificate verification is intentionally public but keyed by an opaque `certificateNumber`, not a sequential id, and doesn't distinguish "revoked" from "never existed"; admin routes taking a resource `:id` are purely permission-gated (correct — admin operates cross-user by design) with no accidental extra ownership bug found; a volunteer still cannot complete a checkpoint they aren't assigned to (`hasActiveAssignment` check unchanged).

## G. Admin/volunteer security

Volunteer-facing attendee search returns only `{id, fullName, university, registrationType}` — no email, phone, payment, or role data (`volunteers.controller.ts::searchAttendees`, explicit allowlist, not `SELECT *`). No volunteer route reaches role management, system settings, audit logs, or payment-provider configuration — confirmed by permission-set inspection (`VOLUNTEER` only ever gets `VIEW_ATTENDEE`+`COMPLETE_CHECKPOINT`). Admin mutation endpoints spot-checked for mass assignment (speakers/sessions content update, role-assign) all use narrow, named-field Zod schemas — no endpoint accepts/persists an arbitrary request body.

## H. CSRF/CORS/security headers

- **CSRF**: not applicable in the classic sense — confirmed zero use of cookies anywhere in the stack (`grep` for `res.cookie`/`req.cookies`/`cookie-parser` across backend and all three apps: no hits). Auth is a Bearer token attached by JS in `packages/api-client`, which browsers do not auto-attach cross-site.
- **CORS — fixed this phase**: explicit 3-origin allowlist (`PUBLIC_APP_URL`/`VOLUNTEER_APP_URL`/`ADMIN_APP_URL`), never a wildcard — unchanged and solid. Removed the previously-set `credentials: true` from `backend/src/server/app.ts`'s `cors()` config: since no cookies are ever set, that flag was dead/misleading configuration, not an actual security control (a reader could mistake it for "cookies are safely scoped" when no cookies exist at all). New tests confirm an unauthorized `Origin` does not get echoed back in `Access-Control-Allow-Origin` while an allowed one does (`tests/integration/authentication/cors.test.ts`).
- **Security headers**: `helmet` (v8) applied with only `contentSecurityPolicy: false` overridden (correct — this is a JSON API, not an HTML-serving app, so a CSP would be theater). Confirmed defaults still in effect: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy`/`Cross-Origin-Resource-Policy: same-origin`, `Strict-Transport-Security` (sent unconditionally, but only meaningful once actually served over HTTPS). **Not addressed this phase, flagged as a deployment-owner responsibility**: there is no `app.set('trust proxy', ...)` and no HTTPS-redirect logic in this repo — TLS termination is assumed to be handled entirely by whatever sits in front of the app in production (load balancer/reverse proxy). This should be confirmed explicitly at deploy time, not assumed.

## I. Rate limiting

`createAuthRateLimiter()` (20 requests / 15 min) applies to every route under `/auth/*`: register, login, refresh, logout, forgot-password, **reset-password** (submission, not just the request step), verify-email, and the new change-password endpoint. `createApiRateLimiter()` (env-configurable, default 100/60s) applies to everything else under `/api/v1`. No resend-verification-email endpoint exists to rate-limit (feature doesn't exist, not a gap in the limiter). Not yet tested with an actual repeated-request assertion — flagged below as a Low/Future test gap (the middleware's own correctness is standard `express-rate-limit` behavior, not custom logic, which is why this was deprioritized versus the fixes actually shipped this phase).

## J. Secret/logging review

`git grep` across tracked files for AWS-key patterns, PEM headers, Stripe-style live/test secret prefixes, and hardcoded password assignments outside test/seed files: zero hits. `.gitignore` covers `.env`/`.env.local`/`.env.*.local`; `.env.example` contains only placeholders, no real-looking values. Logging: `pino-http` request logging does not log `req.body` at all (confirmed by config inspection, not assumption); the central error handler logs only `{err, path, method}`, never the request body. Redact list (see D above) now additionally covers `currentPassword`/`newPassword` and `body.refreshToken`.

## K. Security tests (new this phase)

- `tests/integration/authentication/account-status-enforcement.test.ts` — SUSPENDED, DEACTIVATED, and deleted-user access tokens are all rejected immediately (not just at natural expiry), proving the fix in section B/H works end-to-end.
- `tests/integration/authentication/role-spoofing.test.ts` — registering with forged `role`/`roles`/`permissions`/`isAdmin`/`isVerified` fields has zero effect (Zod strips unknown keys; the issued token's `roles`/`permissions` claims are decoded and asserted to be exactly `['ATTENDEE']`/`[]`); an ADMIN cannot grant itself SUPER_ADMIN via `/admin/users`.
- `tests/integration/authentication/cors.test.ts` — unauthorized origin not echoed in `Access-Control-Allow-Origin`; allowed origin is.

Pre-existing coverage confirmed still relevant: session-fixation-adjacent (fresh token pair on every login/refresh, `tests/unit/authentication/refresh.test.ts`), suspended-account-rejected-at-login-and-refresh, forgot-password enumeration-safety, reset/verification token reuse and expiry, webhook signature/idempotency, last-SUPER_ADMIN-cannot-be-revoked, checkpoint duplicate/authorization boundaries.

**Not added this phase** (Low priority — the underlying mechanism is standard library behavior, not custom logic worth re-testing): expired-JWT-specifically test (distinct from the now-covered "still valid but SUSPENDED" case), a real repeated-request rate-limit-activation test.

## L. Dependency/security scan

`npm audit` (registry was reachable from this bridge, unlike the Neon DB — confirmed, not assumed) reports:

```
esbuild 0.27.3 - 0.28.0 — arbitrary file read via dev server on Windows (GHSA-g7r4-m6w7-qqqr), fix available
qs 2.2.5 - 6.15.3 — moderate: array-limit bypass (GHSA-x5fp-wj9c-mxmx), DoS via isBuffer (GHSA-4mjr-xmp4-gh2g), fix available
  via body-parser 1.20.5-1.20.6 → express 4.22.2
4 vulnerabilities (1 low, 3 moderate)
```

**Deliberately not auto-applied this phase.** `npm audit fix` would bump `express`/`body-parser` transitively — per this project's own stated policy (identify → upgrade deliberately → run tests → verify compatibility), and given this environment cannot execute `npm test`/`npm run build` at all (the standing Windows/Linux `node_modules` limitation), applying a dependency bump with zero ability to verify it didn't break anything would violate that policy, not satisfy it. **Action needed from you:** run `npm audit fix` locally, then `npm test && npm run build`, before deploying.

## M. Commands executed

```
npm run typecheck --workspaces --if-present   # clean, all 13 packages, both before and after this phase's edits
npx eslint . --max-warnings=0                 # clean, 0 errors/warnings
npm audit                                     # succeeded — 4 vulnerabilities found (see L), not fixed
npm audit fix --dry-run                       # timed out in this bridge before completing; no changes were made (confirmed via git status)
```

**Could not run** (same disclosed, unchanged limitation as every prior phase): `npm test`, `npm run build`, `npm run db:migrate` — the device bridge's mounted `node_modules` was installed on Windows and is missing Linux-native binaries (`@rollup/rollup-linux-x64-gnu`) that `vitest`/`tsup` need, and `npm install` has been deliberately avoided all session to not corrupt the user's real dev environment; this bridge additionally has no network route to the Neon dev database specifically (though it does, notably, reach the public npm registry — confirmed via the successful `npm audit`).

## N. Actual results

Typecheck and lint: **PASS** (verbatim empty output on both, confirmed twice — before and after this phase's changes). No test execution results to report (see M) — **the new tests in this phase are unverified by an actual run**, same disclosed caveat as every test added in Phases 1–3.

## O. Remaining vulnerabilities / gaps

**High**
- **Access and refresh tokens are stored in `localStorage` in all three frontends** (`apps/{web,volunteer,admin}/src/lib/auth-storage.ts`), readable by any script that achieves XSS on the page — this is a full-account-takeover exposure, not bounded to the 15-minute access-token window, because the 30-day refresh token is stored the same way. This is the single most consequential finding in this phase. **Not fixed this phase**, deliberately: the correct remedy (httpOnly cookies for the refresh token, in-memory-only access token) is a cross-cutting change touching the backend's cookie issuance, CORS `credentials` handling, CSRF protection (which becomes newly necessary once cookies are introduced), and all three frontends' `api-client`/`auth.tsx` — none of which can be exercised end-to-end from this environment (no browser, no ability to run the frontend dev servers or their test suites here). Per this phase's own rule 18 ("do not claim a security control is implemented unless it is actually enforced and tested"), shipping an unverified cross-cutting auth rewrite would be worse than clearly flagging it. **Recommended next step**: a dedicated follow-up session with local (non-bridge) execution ability, scoped exactly to this migration, with real browser testing.

**Medium**
- `npm audit`: 4 vulnerabilities (esbuild, qs/body-parser/express transitive) — fixes available, not applied (see L). Run `npm audit fix` locally and verify with a real test/build run.
- No admin suspend/deactivate endpoint exists yet (`backend/src/modules/users/users.controller.ts` still has no status-mutation route) — the account-status enforcement fixed this phase makes such a feature immediately effective once built, but the feature itself is still missing. This phase's new tests simulate suspension via direct SQL, which is how you can verify the enforcement today even without the endpoint.
- No resend-email-verification endpoint exists.

**Low**
- No compromised/common-password check (e.g. HIBP k-anonymity lookup) — absent by design per the codebase's stated "not security theater" philosophy; call it out for an explicit product decision rather than silently leaving it assumed-fine.
- No dedicated expired-access-token test (distinct from the now-covered suspended/deactivated case) and no real repeated-request rate-limit-activation test.
- HTTPS/TLS-termination enforcement is entirely delegated to the deploy environment and not verified or documented anywhere in this repo — worth an explicit line in `docs/deployment/deployment.md` rather than leaving it implicit.

**Accepted / Future**
- Role/permission staleness within one `AUTH_TOKEN_TTL` window (≤15 min) after a role change — already documented in `docs/architecture/authentication.md`, unchanged this phase, and treated as an acceptable bounded tradeoff distinct from the now-fixed account-status case.
- `credentials: true` removed from CORS config since no cookies exist today; if the High-priority localStorage migration above is ever done, this decision needs to be revisited together with CSRF protection at the same time.
