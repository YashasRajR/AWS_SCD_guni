# Phase 5 — Frontend API Integration & Functional Application Workflows Report

**Date:** 2026-09-04. Method: a read-only agent audit traced the actual state of `apps/web`, `apps/volunteer`, `apps/admin`, and `packages/api-client` against the Phase 5 spec's checklist (shared API client, auth state model, protected routing, per-page wiring, no-fake-data/no-QR sweeps, error-state handling, type safety), citing file:line for every claim. Concrete gaps were then implemented and verified with `tsc`/`eslint`. Every claim below is evidence-based, not assumed.

## A. Shared API client & auth state architecture — audited, not rebuilt

`packages/api-client/src/index.ts` was already a real implementation, not a stub: envelope unwrapping, `Authorization: Bearer` header injected fresh per request (never cached), a genuine token-refresh-on-401 flow (`attemptRefresh` + single-retry + `refreshPromise` de-duplication so concurrent 401s trigger exactly one `/auth/refresh` call), and `AbortController`-based timeouts. This needed no rework.

Each app's `src/lib/auth.tsx` already implements a real state machine — `'checking' | 'signed-out' | 'signed-in'`, not a boolean — with route guards (`RequireAttendee`/`RequireVolunteer`/`RequireAdmin`) that issue a real `<Navigate>` redirect, not a hidden div. Logout and API-driven 401 share one code path (`clearStoredSession()` + a custom DOM event the auth context listens for), so there's no drift between "user clicked logout" and "server said your token is dead." This codebase has no global data cache (no React Query/SWR — every fetch is a local `useState`/`useEffect`), so the "clear cached data on logout to avoid cross-user leakage" requirement is structurally satisfied: there is no cache to leak.

## B. Fixed this phase: payment flow (apps/web) — the single largest gap found

The audit found the attendee-facing payment flow **did not exist in the UI at all**, despite the backend having working, webhook-confirmed Razorpay integration (`POST /me/payment/initiate`, `GET /me/payment` — `backend/src/modules/user-dashboard/*`). Event registration in the UI created a registration for free with no payment step, so a paid event edition had no way for an attendee to ever pay.

Added:
- `apps/web/src/lib/razorpay.ts` — loads Razorpay's Checkout widget script on demand (never bundled — a third-party script must come straight from Razorpay), opens it with the order returned by `/me/payment/initiate`.
- A **Payment** card in `DashboardPage.tsx`, shown only when `event.registrationFee > 0` and the registration is still `PENDING`. It never marks a payment "successful" itself — the Checkout `handler` callback only sets a "submitted — confirming" status and re-fetches `/me/payment` from the server; the actual `PAID` status only ever comes from the backend, which only trusts its own signature-verified webhook (`payments.service.ts::handleWebhook`), exactly matching the phase rule that the frontend must never locally decide `payment = success`.
- `statusTone()` (`apps/web/src/lib/format.ts`) extended to cover the full `PaymentStatus` enum (`PROCESSING`/`PAID`/`REFUNDED`, previously only registration/ticket statuses were mapped).

Free-edition events (`registrationFee === "0.00"`, the current dev-seed default) are unaffected — the card doesn't render and registration stays instant, as before.

## C. Fixed this phase: per-status-code error messages (all three apps)

The audit found every list/detail fetch collapsed 401/403/404/409/429 into one generic message — a 403 (no permission) read identically to a 500. Added `describeApiError()` to `packages/api-client/src/index.ts` (shared, so it isn't reimplemented three times) and wired it into all three apps' `lib/hooks.ts` (`useResource`/`usePaginatedResource`), replacing the previous `err instanceof ApiClientError ? err.message : 'Failed to load.'` fallback everywhere those hooks are used:

| Status | Message |
|---|---|
| 401 | "Your session has expired. Please sign in again." |
| 403 | "You don't have permission to do this." |
| 404 | "Not found." |
| 409 | server's own message (already specific per-endpoint, e.g. "This registration has already been paid for.") |
| 429 | "Too many requests — please wait a moment and try again." |
| other | server's own message |

Form-submission error handlers (e.g. login's "wrong password", change-password's "current password incorrect") were left as-is — those already surface a specific, correct server message and aren't the generic list-loading path this gap was about.

## D. Fixed this phase: social share on Event Wrapped (apps/web)

`EventWrappedPage.tsx` had no share affordance at all, despite being explicitly named in the phase checklist. Added a real share action: `navigator.share()` where available (opens the OS's actual native share sheet — the user picks the destination, nothing is auto-posted), falling back to `navigator.clipboard.writeText()` with a "copied — paste it anywhere" confirmation where it isn't. At no point does the UI claim a post was made to a specific platform ("Posted to LinkedIn/Instagram") — it only ever hands off to a mechanism the user controls, per the phase's explicit prohibition on fabricated share-confirmation UX.

## E. Fixed this phase: admin user/role management UI (apps/admin)

The audit found `backend`'s `/admin/users` (list) and `/admin/users/:id/roles` (grant/revoke, `MANAGE_ROLES`/SUPER_ADMIN-only) routes had **no corresponding page** in `apps/admin` at all — a real, if narrow, gap since role management (the most sensitive admin capability in the system) was API-only. Added `apps/admin/src/pages/UsersPage.tsx`: lists users with their current roles as removable badges and a per-row "grant a role" select, wired to the exact two existing backend routes (nothing new added server-side). Nav-gated behind `PERMISSIONS.MANAGE_ROLES` in `AdminLayout.tsx`, matching every other nav entry's existing permission-gating pattern — an ADMIN (non-SUPER_ADMIN) simply won't see the link, and if they hit the route directly, every call now surfaces a clean "You don't have permission to do this." via `describeApiError` rather than a raw 403 body.

## F. Confirmed correct, not touched

- **No QR/NFC/camera/barcode anywhere** — grepped all three apps' `src/` for `QR|QRCode|NFC|barcode|camera|scan` (case-insensitive): zero matches. Volunteer attendance marking is 100% manual search-and-click (`CheckInPage.tsx`), matching this platform's explicit "no QR/NFC" rule everywhere, not just by omission.
- **No fake/mock/hardcoded data** — grepped for `mock|fake|TODO|FIXME|hardcoded|Math\.random\(\)|placeholder|dummy|lorem` across all three apps: zero real hits (every "placeholder" match was an HTML `placeholder=` attribute, not fabricated content).
- **Zero `any`/`as any`** in any of the three apps' `src/`.
- Every admin content/operational module (speakers, sessions, agenda, timeline, venues, FAQs, announcements, registrations, attendees, payments, tickets, checkpoints, volunteers, certificates, achievements, audit logs, emails) already wired to its real backend route — 8 spot-checked request/route pairs all matched exactly.
- Attendee dashboard, profile, ticket, checkpoint progress, certificates, achievements, and Event Wrapped were all already fully wired to real `/me/*` endpoints with real loading/empty/error states per section (`DashboardPage.tsx`'s `SectionError` pattern, used independently per card).

## G. Not addressed this phase — carried forward from Phase 4, unchanged

**The localStorage token-storage architecture was not touched.** Confirmed again this phase: all three apps' `src/lib/auth-storage.ts` store both the access token and the 30-day refresh token in plain `localStorage` (documented, not accidental, in `docs/architecture/authentication.md`). Phase 5's own checklist re-raises this exact question. The decision made this phase: **do not attempt the migration now, for the same reason given in the Phase 4 report** — the correct fix (httpOnly cookie for the refresh token, `credentials: 'include'` on the shared `ApiClient`, dropping `getRefreshToken`/`onTokenRefreshed` from the client's public surface, backend cookie issuance on `/auth/login`/`/auth/refresh`, and newly-necessary CSRF protection since cookies are now in play) is a cross-cutting change touching the backend and all three frontends' auth wiring simultaneously, and this bridge has no browser and cannot run the frontend dev servers or their test suites to verify it end-to-end. Shipping an unverified rewrite of the core auth transport would violate this project's own non-negotiable rule against claiming an unverified security control. This remains the top recommended follow-up, scoped to a session with real browser/local execution access.

## H. Not built this phase — explicitly out of scope, not a defect

- **Session-level attendance tracking** (`GET /me/sessions` returns `[]` by design — `user-dashboard.controller.ts` comment confirms `session_attendance` doesn't exist as a table yet; this is a backend data-model gap from an earlier phase, not a frontend integration bug).
- Admin suspend/deactivate-user endpoint still doesn't exist server-side (Phase 4 finding, unchanged) — nothing for the frontend to wire to yet.

## I. Type safety

`describeApiError` and the Payment-card additions introduce no new `any`/`as any` anywhere (grepped after the change: still zero in all three apps). `packages/api-client`'s new export is fully typed against `ApiClientError`/`unknown`. The new `UsersPage.tsx` uses a page-local `UserWithRoles` interface (extends the shared `@scd/types` `User`) rather than redefining `User` itself, matching the existing pattern the Phase 5 audit found elsewhere (`MeData`, `AttendeeResult`, etc. — response-shape wrappers, not domain-type redefinitions).

## J. Tests

Frontend test infrastructure exists only in `apps/web` (Vitest + Testing Library; `apps/admin`/`apps/volunteer` have no test runner configured at all — pre-existing, not something this phase set up, since introducing a new dependency/test harness for a one-off addition isn't warranted by the ladder). Added `apps/web/tests/lib/errors.test.ts`: asserts `describeApiError` produces a distinct message per status code (401/403/404/429), preserves the server's own message for 409, falls back correctly for both an unmapped status and a non-`ApiClientError` (e.g. a network `TypeError`), and asserts `statusTone` now maps every `PaymentStatus` value. Manually type-checked against a temporary tsconfig that additionally includes `tests/` (the project's real `apps/web/tsconfig.json` scopes `include` to `src` only, so `npm run typecheck` does not itself cover any test file, pre-existing and unrelated to this phase) — zero errors from the new file specifically (one unrelated pre-existing type error was found in `EventHero.test.tsx`, not introduced by this phase, not fixed here since it's outside this phase's scope).

## K. Commands executed

```
npm run typecheck --workspaces --if-present   # clean, all 13 packages, before and after this phase's edits
npx eslint . --max-warnings=0                 # clean, 0 errors/warnings
```

**Could not run** (same disclosed, unchanged limitation as every prior phase): `npm test`, `npm run build`, `npm run db:migrate` — the device bridge's mounted `node_modules` was installed on Windows and is missing Linux-native binaries (`@rollup/rollup-linux-x64-gnu`) that `vitest`/`tsup` need, and `npm install` has been deliberately avoided all session to not corrupt the user's real dev environment. This bridge has no network route to the Neon dev database. **This means the new `errors.test.ts` is unverified by an actual run** (same caveat as every test added in prior phases), and — more importantly for this phase specifically — **none of the frontend changes (Payment card, share button, Users page) have been visually or interactively verified in a real browser**, since this bridge has no browser and cannot run `npm run dev` for any of the three apps. Only static correctness (types, lint, and manual code tracing against the real backend routes/types) has been verified.

## Classification of remaining findings

**Blocking** (should be resolved before this phase is considered fully done)
- The Payment card, share button, and Users page have never been exercised in a running browser against a live backend + Razorpay test credentials. Please run `npm run dev` locally and manually walk: (1) a paid-event registration → Pay now → Razorpay test-mode checkout → webhook confirms → registration flips to CONFIRMED; (2) Event Wrapped → Share; (3) Users page as a SUPER_ADMIN → grant/revoke a role.

**Non-blocking**
- localStorage token storage (see G) — deliberately deferred, needs a dedicated follow-up session with browser access.
- `npm audit`'s 4 dependency vulnerabilities (unchanged from Phase 4, not re-scanned this phase since nothing dependency-related changed).
- No admin suspend/deactivate endpoint; no resend-verification-email endpoint (both backend gaps from Phase 3/4, unchanged).

**UI/UX-deferred**
- Status-code-specific messaging (section C) covers the message text only — no dedicated visual treatment (icon/color) per status code was added, since the phase's core ask (don't show identical text for a 403 and a 500) is satisfied by the message alone.
- No "download as image" or platform-specific share cards for Event Wrapped — the native share sheet / clipboard fallback covers the "let the user share this" requirement without fabricating a platform-specific integration that doesn't exist.
