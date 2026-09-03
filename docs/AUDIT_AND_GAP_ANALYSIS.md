# Phase 1 — Repository Audit, Requirements Traceability & Architecture Gap Analysis

**AWS Student Community Day 2026 platform — audit date 2026-09-03**

Method: this repository was inspected via a direct shell bridge to the developer's
machine (`D:\GUNI\AWS STUDENT COMMUNITY DAY (SCD)\student-community-day`), reading
actual source files, migrations, and route registrations rather than assuming the
directory layout. Every status below is based on tracing execution paths (imports,
route mounts, service calls), not file presence alone. `npm run build` / `npm test`
/ `vitest` could **not** be executed from this bridge this session (the mounted
`node_modules` was installed on Windows; the bridge's shell is a Linux VM missing
the Linux-platform native binaries for rollup/esbuild — `Cannot find module
@rollup/rollup-linux-x64-gnu`). Everywhere below marked "run locally to confirm" was
verified by `tsc --noEmit` and `eslint --max-warnings=0` (both ran clean at time of
audit) plus manual code tracing, but not by an actual test/build execution.

This document supersedes the prior Phase 0 audit (dated 2026-09-02), which found
Payments/Email/Certificates/Achievements/Event Wrapped as non-functional stubs —
all of that has since been built out; see the module-by-module status below for
the current, verified state.

---

## Repository Summary

npm-workspaces monorepo: three Vite/React SPAs (`apps/web`, `apps/volunteer`,
`apps/admin`), one Express/TypeScript backend (`backend/`), nine shared packages
(`packages/*`), a hand-rolled SQL migration system (`database/`), and a moderate
docs tree (`docs/`). This is **not** a fresh scaffold — it is a substantially built
platform: 24 backend domain modules, 34 applied migrations, working auth/RBAC,
registration→payment→ticket→email flows, admin CRUD across 8 content types with
search/sort, certificate/achievement rule engines, and a CI workflow. The README
(`README.md`, last edited before this session's payments/certificates/achievements
work) still says "foundation phase complete" — it is stale and should be updated
once this platform is verified locally; it undersells the current state.

Several root-level directories are **inert scaffolding**, not real functionality:
`config/environments/*`, `infrastructure/README.md`, and every file under
`scripts/database`, `scripts/deployment`, `scripts/development`, `scripts/testing`
are all **0 bytes**. The actual equivalents are `backend/src/config/env.ts` (config),
`database/scripts/*.mjs` (the real migrate/seed scripts, wired into
`package.json`), and `.github/workflows/ci.yml` (CI). Likewise
`backend/src/{repositories,services,queues,validators}` are empty directories —
dead leftovers from an initial scaffold superseded by the actual
`backend/src/modules/<domain>/{controller,service,repository,routes,types}.ts`
pattern that every real module follows. None of this is used by anything that
imports it; nothing points at these paths. Recommend deleting them in a later
cleanup pass — flagged, not touched, per this phase's rules.

Each frontend app (`apps/web`, `apps/volunteer`, `apps/admin`) also has five empty
directories (`src/api`, `src/app`, `src/features`, `src/services`, `src/store`) —
same story: initial scaffold, superseded by `src/lib` + `src/pages` +
`src/components`, never populated. Not dead *code* (no files in them), just dead
directories.

## Current Architecture

Modular monolith backend + three independent SPAs + shared TypeScript packages +
one PostgreSQL database — **this already matches the architecture this phase asks
to prefer**. No microservices, no GraphQL, no Redis/Kafka/queues exist in the
codebase; email delivery uses an in-process interval-polling worker against a
`email_records` outbox table instead of a message queue, which is the correct
scale-appropriate choice here. No architecture change is recommended.

```
apps/web        Public site + attendee dashboard (React 18 + Vite + react-router-dom)
apps/volunteer  Mobile-first volunteer checkpoint portal (React + Vite)
apps/admin      Admin CMS + operations (React + Vite)
backend         Express 4 + TypeScript, controller/service/repository per module
database        PostgreSQL (Neon in dev — see .env), hand-rolled migration runner
packages/*      types, validation (zod), constants, api-client, auth (RBAC), config, utils, ui, eslint-config
```

Request pipeline (`backend/src/server/app.ts`): helmet → CORS (allow-listed to the
three known app origins, not `*`) → pino-http request logging with correlation IDs
→ JSON body parsing (captures raw bytes for webhook signature verification) → rate
limiting → route-level `authenticate` → `requireRole`/`requirePermission` →
`validate` (zod) → controller → service → repository → Postgres → uniform
`{ success, data|error }` JSON envelope.

## Application Inventory

| App | Framework | Pages | Talks to real backend? | Notable gaps |
|---|---|---|---|---|
| `apps/web` | React 18 + Vite | ~30 (home, speakers, sessions, agenda, timeline, venues, FAQs, register, login, dashboard, profile, ticket, achievements, certificate, event-wrapped, ...) | Yes — `useResource`/`usePaginatedResource` hooks call the real `/api/v1/*` API via `@scd/api-client`; no mock/fake data found in a repo-wide grep | Dashboard error states were added this session; some pages (SessionDetailsPage, SpeakerDetailsPage, TicketPage as directories) weren't individually re-verified this pass |
| `apps/volunteer` | React 18 + Vite | Login, Dashboard, Checkpoints, CheckIn, AttendeeSearch, AttendeeDetails, History, Unauthorized | Yes — same pattern, calls `/api/v1/volunteer/*` | — |
| `apps/admin` | React 18 + Vite | Dashboard, 8 content-management pages (event/speakers/sessions/agenda/timeline/venues/faqs/announcements), Registrations, Attendees, Payments, Tickets, Checkpoints, Volunteers, Certificates, Achievements, Emails, Audit logs | Yes — nav is now permission-scoped, all 8 content lists have search/sort | — |

No app was found routing through mocked/local/random data. `dist/` build output
exists in all three app directories from a prior build (stale, gitignored — not a
concern).

## Backend Module Inventory

Status legend: **COMPLETE** (controller+service+repository+routes+validation+
authorization all present and traced end-to-end), **PARTIAL** (working but with a
known, scoped-out limitation), **SCAFFOLD** (types+repository only, no HTTP
surface), **BROKEN**, **MISSING**.

| Module | Status | Notes |
|---|---|---|
| `auth` | COMPLETE | register/login/logout/verify-email/forgot-password/reset-password, bcrypt (cost-factor const, not hardcoded weak), JWT via `jsonwebtoken`, `auth_tokens` table for verification/reset tokens |
| `users` | COMPLETE | supports transactional creation (used inside `auth.register`'s `withTransaction`) |
| `attendees` | COMPLETE | — |
| `registrations` | COMPLETE | DB-unique-constrained (migration 033) + app-level duplicate check, transaction-wrapped creation, tested (unit + integration this session) |
| `payments` | COMPLETE | Razorpay via raw `fetch` (no SDK dependency), HMAC-SHA256 webhook verification (`timingSafeEqual`), idempotent on `provider_order_id`, unit-tested this session |
| `tickets` | COMPLETE | issued idempotently on registration→CONFIRMED transition only |
| `emails` | COMPLETE (console provider only) | outbox pattern (`email_records`), interval-polling worker with backoff; **no real SMTP provider implemented yet** — deliberate scope decision this session, not a bug — emails are logged, not sent |
| `speakers`/`sessions`/`agenda`/`timeline`/`venues`/`faq`/`announcements`/`event` | COMPLETE | full CRUD, public+admin route pairs, search/sort added this session via shared `paginatedListQuery` |
| `checkpoints` | COMPLETE | volunteer completion flow, duplicate-attendance DB-safe (integration-tested) |
| `volunteers` | COMPLETE | attendee search, checkpoint assignment, self routes separate from admin routes |
| `certificates` | COMPLETE | real eligibility rule (CONFIRMED registration + ≥1 checkpoint completion), race-safe issuance (partial unique index, migration 034), public verification endpoint that never leaks attendee PII |
| `achievements` | COMPLETE | rule-based auto-evaluation (`CHECKPOINT_COUNT`, `FULL_ATTENDANCE`), triggered after checkpoint completion; `MANUAL`/`SESSION_COUNT` are intentionally admin-only/not-yet-implemented, not silently faked |
| `event-wrapped` | COMPLETE | aggregates real attendee data (registration, checkpoints, achievements, certificates) |
| `audit-logs` | COMPLETE | write-on-privileged-action, admin-readable |
| `reports` | COMPLETE | admin dashboard aggregate stats |
| `social-sharing` | **SCAFFOLD** | repository + service only (`listForAttendee`), no controller, no routes — not reachable over HTTP at all. Not in the master spec's required feature list; leave as-is or remove, doesn't block anything |
| Settings | **MISSING as a distinct module** | Event-level settings (fee, registration window, currency) live on the `event` module (`PATCH /admin/content/event`) rather than a separate `settings` module — this is a reasonable design choice given there's one event, not a gap, but flagging since the master spec lists "Settings" separately |

## Database Inventory

34 applied migrations (`001`...`034`), one per table/constraint, each with a
matching `.down.sql`. Core tables: `users`, `roles`, `permissions`,
`role_permissions`, `events`, `attendees`, `registrations`, `payments`, `tickets`,
`speakers`, `sessions`, `session_speakers`, `venues`, `agenda_items`,
`timeline_items`, `faqs`, `announcements`, `checkpoints`, `volunteers`,
`volunteer_checkpoint_assignments`, `checkpoint_attendance`, `certificates`,
`achievements`, `attendee_achievements`, `event_wrapped`, `social_shares`,
`email_records`, `audit_logs`, `auth_tokens`. All present, all implemented (no
placeholder tables found). Later migrations (030-034) added delivery-tracking
fields to `email_records`, a `registration_fee` column to `events`, a
`provider_order_id` column to `payments`, and two race-safety constraints this
session (`registrations.attendee_id` unique; a partial unique index on
`certificates(attendee_id, certificate_type) WHERE status='ISSUED'`).
`docs/database/schema.md` and `docs/database/relationships.md` exist as
documentation but were not diffed against the live migrations this pass — treat the
migrations directory, not the docs, as ground truth per this phase's rules.

Not independently re-verified this pass (would require DB access, which this
environment doesn't have): full index coverage beyond what's referenced in code
(e.g. whether `checkpoint_attendance(attendee_id, checkpoint_id)` has a supporting
unique index the way `registrations`/`certificates` now do — checkpoints.test.ts's
passing "rejects completing the same checkpoint twice" integration test implies one
exists, but the migration file itself wasn't re-read this pass).

## API Inventory

~90 endpoints across 24 route files, organized as PUBLIC (`/event`, `/speakers`,
`/sessions`, `/agenda`, `/timeline`, `/venues`, `/faqs`, `/announcements`,
`/certificates/verify/:number`), AUTH (`/auth/*`), ATTENDEE (`/me/*`,
identity-scoped, no id parameters — ownership by construction), PAYMENTS
(`/payments/webhook` — public, signature-verified; `/payments/initiate` —
authenticated), VOLUNTEER (`/volunteer/*`), and ADMIN (permission-gated,
`/admin/*` + `/admin/content/*`). Every admin route is gated by
`requirePermission(PERMISSIONS.<X>)`, cross-checked against `packages/constants/src/permissions.ts`
this session when building the admin nav — no route was found trusting a
client-supplied role or permission. Representative sample (full list traced, not
reproduced verbatim here for length):

| Method | Endpoint | Actor | Auth | Authorization | Implementation |
|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | — | — | COMPLETE, transaction-wrapped |
| POST | `/api/v1/auth/login` | Public | — | rate-limited | COMPLETE |
| GET | `/api/v1/me/ticket` | Attendee | required | `requireRole('ATTENDEE')`, self-scoped | COMPLETE, ownership-tested |
| POST | `/api/v1/payments/webhook` | Provider | HMAC signature | signature only | COMPLETE, idempotent, unit-tested |
| PATCH | `/api/v1/admin/registrations/:id/status` | Admin | required | `MANAGE_REGISTRATIONS` | COMPLETE |
| POST | `/api/v1/admin/certificates` | Admin | required | `MANAGE_CERTIFICATES` | COMPLETE, eligibility-enforced |
| GET | `/api/v1/certificates/verify/:number` | Public | — | — | COMPLETE, PII-safe |
| GET | `/api/v1/volunteer/attendees/search` | Volunteer | required | `requireRole('VOLUNTEER')` | COMPLETE |

No missing endpoint was found against the requirements list in the master prompt —
every listed attendee/admin/volunteer/public capability has a corresponding route.

## Authentication Status

bcrypt password hashing (cost factor as a named constant, not a magic number), JWT
access tokens signed with `AUTH_SECRET` (schema-enforced ≥16 chars, no default —
`getEnv()` throws a readable error if unset), separate `auth_tokens` table for
single-use email-verification/password-reset tokens (not reusing the JWT
mechanism for those, which is the correct separation). **Update, same day**: refresh tokens have since been implemented — see
`docs/architecture/authentication.md`. `POST /auth/refresh` rotates a
DB-backed, hashed refresh token (`refresh_tokens` table, migration 035) on
every use; `POST /auth/logout` now really revokes the presented refresh
token instead of being a no-op; a password reset revokes every outstanding
refresh token for that user. `@scd/api-client` transparently refreshes on a
401 across all three frontends. The access token itself is still a
stateless JWT with no denylist — an accepted tradeoff, not a gap. Ownership is enforced structurally — `/me/*` never
takes a client-supplied id, resolving everything from `req.identity` set by
`authenticate` — so IDOR/BOLA on attendee-owned resources is architecturally hard
to introduce by accident, and this session added integration tests
(`tickets/ownership.test.ts`) confirming it in practice for tickets. Admin/
volunteer routes were spot-checked (`authorization.test.ts`) confirming an
ATTENDEE gets 403 on admin routes and a VOLUNTEER gets 403 on admin routes.

## Authorization Status

Role-based (`ADMIN`/`VOLUNTEER`/`ATTENDEE`) plus granular permission codes
(`MANAGE_SPEAKERS`, `MANAGE_PAYMENTS`, etc., seeded via `role_permissions`).
`requirePermission`/`requireRole` middleware gates every admin/volunteer route; no
route was found gating only in the frontend. This session closed the one known
authorization *UX* gap (not a security hole — the backend already 403'd
correctly): the admin nav previously showed every section to any signed-in admin
regardless of permission. It's now filtered by `hasPermission(identity, ...)`,
matched link-by-link against each route's actual `requirePermission(...)` call.

## Registration Flow Status

Frontend form → `POST /me/registration` → zod validation → `registrations.service`
(duplicate check + event registration-window check) → DB insert with a unique
constraint backstop → (if the event has a fee) `POST /me/payment/initiate` →
Razorpay order → checkout widget → **only the webhook**, never the frontend,
confirms payment → `registrations.service.updateStatus('CONFIRMED')` →
`ticketsService.issueIfNeeded` (idempotent) → confirmation/ticket emails enqueued.
Traced end-to-end this session with both unit tests (mocked) and integration tests
(real DB, including a concurrent double-submit). No break in the chain was found.

## Payment Flow Status

**Critical question from the master prompt: can the frontend make the system
believe a payment succeeded? No.** `paymentsService.initiatePayment` only ever
creates a provider order for the checkout widget; `handleWebhook` is the sole
writer of `PAID`/`FAILED` status, gated on `verifyWebhookSignature` (HMAC-SHA256,
`timingSafeEqual`, raw-body-based — not the re-serialized `req.body`). A forged or
malformed webhook is rejected before any DB write. A replayed/duplicate webhook is
a no-op once the payment is in a terminal state (unit-tested this session,
including the specific case of a `payment.failed` arriving after `payment.captured`
— it's correctly ignored, never downgrades a PAID payment).

## Ticket Flow Status

Issued once, idempotently, on the registration's first transition into
`CONFIRMED` (webhook-driven or admin-driven — both paths converge on the same
`updateStatus` method, so neither needs its own idempotency guard). No QR/NFC
anywhere in the codebase (grep-confirmed this session and in the README's own
stated constraint). Attendee retrieval is ownership-scoped (`/me/ticket`, no id
param); admin retrieval is `MANAGE_REGISTRATIONS`-gated.

## Email Status

Real outbox pattern (`email_records` table + interval-polling worker with
exponential backoff, capped at 30 min, max 5 attempts), all templates render both
HTML and text with proper escaping (unit-tested). **Update, same day**: `SmtpEmailProvider` (nodemailer-based) has since been
implemented and is picked automatically once `EMAIL_SMTP_HOST` is set — see
`src/integrations/email/smtp-provider.ts`. It is not yet configured or
tested against a real mailbox (no SMTP account credentials were provided
this session); until `.env`'s `EMAIL_SMTP_*` values are filled in and
verified, the platform still falls back to the console provider. This is
now a **configuration task**, not an implementation gap.

## Admin Status

| Feature | View | Create | Edit | Delete | Search | Filter/Sort | Audit | Backend | Tests |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Speakers/Sessions/Agenda/Timeline/Venues/FAQs/Announcements (×7) | Y | Y | Y | Y | Y | Y | Y | Y | integration (content-management.test.ts) |
| Event details | Y | — | Y | — | — | — | Y | Y | — |
| Registrations | Y | — | Y (status) | — | — | — | Y | Y | integration |
| Attendees | Y | — | — | — | **N** | **N** | — | Y | — |
| Payments | Y | — | — | — | — | — | — | Y | unit (webhook) |
| Tickets | Y | — | — | — | — | — | — | Y | — |
| Checkpoints | Y | Y | Y | Y | — | — | — | Y | integration |
| Volunteers | Y | Y | Y | Y | — | — | — | Y | — |
| Certificates | Y | Y (issue) | — | Y (revoke) | — | — | Y | Y | unit + integration |
| Achievements | Y | Y | Y | Y | — | — | — | Y | unit |
| Emails | Y | — | — | — | — | — | — | Y | — |
| Audit logs | Y | — | — | — | — | — | n/a | Y | — |

The admin **Attendees** list is the one gap found this pass: it has no
search/filter, unlike the 8 content modules and unlike what the certificate
verification integration test had to work around by searching via the *volunteer*
attendee-search endpoint instead. Not broken, just missing the same
`paginatedListQuery` treatment the content modules got. Flagged as P2.

## Volunteer Status

Authentication (JWT, `requireRole('VOLUNTEER')`), attendee search, checkpoint
listing scoped to assigned checkpoints only, checkpoint completion with duplicate
prevention (DB-backed, integration-tested) and assignment enforcement (`403
CHECKPOINT_NOT_ASSIGNED` if a volunteer tries a checkpoint they're not assigned
to), history. Confirmed a volunteer cannot reach admin endpoints
(`authorization.test.ts`).

## Attendee Status

Registration, email verification, login/logout, forgot/reset password, profile,
registration status, payment status, ticket, personal sessions, progress
(checkpoint completions), achievements, certificate, Event Wrapped, account
settings — all present and backend-driven via `/me/*`. Dashboard error states
(failed API calls now show a retry affordance instead of silently rendering
nothing) were added this session.

## Attendance Status

Volunteer-authenticated → attendee search → attendee selection → checkpoint
(activity) selection → attendance record. **No QR/NFC** — confirmed. Checkpoints
(the "event activities" — Registration, Breakfast, etc.) are admin-managed rows in
the `checkpoints` table (full CRUD exists), not hard-coded constants — this
already satisfies the master spec's "must not become hard-coded permanent
activities" requirement.

## Certificate Status

Eligibility is **backend/domain logic**, not frontend or manual-only: a real rule
(`CONFIRMED` registration + ≥1 checkpoint completion) enforced in
`certificates.service.issue()` before any row is created, race-safe via a partial
unique DB index, unit- and integration-tested this session including the "admin
tries to issue to an ineligible attendee" rejection case. Public verification
endpoint never leaks attendee contact info and doesn't distinguish revoked from
unknown (both `valid:false`).

## Achievement Status

Rule-based, backend-only (`achievements.service.evaluateCondition`), triggered
automatically after checkpoint completion (best-effort — a failure here never
fails the attendance record itself). No achievement logic was found embedded in
any frontend component. `MANUAL` achievements are correctly never auto-evaluated;
`SESSION_COUNT` correctly returns `false` (documented as not-yet-implemented)
rather than being silently faked as always-true or always-false without comment.

## Event Wrapped Status

Aggregates real attendee data (registration, checkpoint completions, unlocked
achievements, issued certificates) — not synthetic/sample data. Not
independently re-verified against a live dataset this pass (no DB access from this
environment).

## Security Findings

| Finding | Severity | Status |
|---|---|---|
| Frontend cannot force a payment success | — | Confirmed safe (see Payment Flow Status) |
| Webhook forgery | — | Confirmed protected (HMAC + timing-safe compare) |
| IDOR on attendee-owned resources | — | Confirmed protected (identity-scoped, no id params; tested) |
| Cross-role privilege escalation (attendee→admin, volunteer→admin) | — | Confirmed protected (integration-tested) |
| Plaintext passwords | — | Not found (bcrypt) |
| Secrets committed to git | — | Not found (`.env` never committed, gitignored; no hardcoded keys found in a repo-wide scan for common secret patterns) |
| CORS | — | Allow-listed to the three known app origins, not `*` |
| Rate limiting | — | Present, general + stricter auth-specific limiter |
| Sensitive data in logs | LOW (mitigated this session) | Logger redact list extended this session to cover payment secrets and card fields beyond the original password/token coverage |
| Admin attendee list has no search | LOW / usability, not security | See Admin Status |
| Refresh-token rotation | — | Implemented same day: DB-backed, hashed, rotated on every use, revoked on logout and on password reset |
| Mass assignment | Not found | Every write path was seen going through a zod schema + explicit field mapping (`toX()` functions), not raw `req.body` spread into a query |
| File uploads | N/A | No file upload endpoints exist in this codebase |

No CRITICAL or HIGH severity issue was found this pass. The one MEDIUM item
(refresh tokens) is a "needs verification," not a confirmed defect.

## Testing Findings

Real coverage exists: unit tests (payment webhook signature, email templates,
certificate eligibility, achievement rules, payment webhook idempotency —
DB-free, run via a separate `vitest.unit.config.ts` added this session) and
integration tests (auth, admin authorization + content CRUD, volunteer checkpoint
flow including duplicate-attendance, duplicate registration, ticket ownership,
certificate verification — all DB-backed via a real Postgres test database that
CI now provisions). **Gaps**: no E2E test suite exists at all (Playwright isn't
installed); no test explicitly covers session-expiry-mid-checkout, expired
password-reset token, or malformed/malicious-input fuzzing; `apps/web` has a
`tests/` directory with some component tests, `apps/admin`/`apps/volunteer` still
have no-op test scripts. None of the test suites could actually be *executed*
from this environment this session (see the method note at the top) — they are
believed correct from tracing + `tsc`/`eslint`, not confirmed by a green run.

## Dependency Findings

No duplicate libraries for the same purpose were found (one HTTP client pattern
via a shared `@scd/api-client`, one validation library — zod, one ORM-equivalent —
raw `pg` with hand-written SQL, not two competing query builders). Razorpay is
integrated via native `fetch`, deliberately avoiding an SDK dependency for one
provider call shape. No unused major dependency was flagged in this pass (a full
`depcheck`-style pass wasn't run — this would need `npm install` to execute,
unavailable from this bridge).

## Requirements Matrix

| Requirement | Status | Location | Missing Work | Priority | Dependencies |
|---|---|---|---|---|---|
| Registration | COMPLETE | `backend/src/modules/registrations` | — | — | — |
| Payment (Razorpay) | COMPLETE | `backend/src/modules/payments`, `integrations/payment` | — | — | — |
| Ticket generation | COMPLETE | `backend/src/modules/tickets` | — | — | — |
| Real email delivery | PARTIAL | `backend/src/integrations/email` | `SmtpEmailProvider` is implemented; fill in and verify real `EMAIL_SMTP_*` credentials in `.env` | P2 (config, not code) | an SMTP account (Gmail app password / Brevo / Mailtrap / self-hosted) |
| Admin attendee search/filter | MISSING | `backend/src/modules/attendees` | Apply the same `paginatedListQuery` pattern used for the 8 content modules | P2 | none |
| E2E test suite | MISSING | `tests/e2e/*` (empty) | Install Playwright, cover the 17-step flow from the master spec | P2 | a running dev server (or CI service) to test against |
| Refresh-token rotation | COMPLETE | `backend/src/modules/auth`, migration 035, `@scd/api-client` | — | — | — |
| Repo cleanup (dead scaffold dirs) | MISSING | root `config/`, `infrastructure/`, `scripts/{database,deployment,development,testing}`, `backend/src/{repositories,services,queues,validators}`, each app's 5 empty `src/*` dirs | Delete once confirmed unused (this pass confirmed 0 references) | P3 | none |
| README accuracy | STALE | `README.md` | Update "foundation phase complete" status line to reflect payments/certs/achievements/CI now built | P3 | none |
| CD / live deployment | MISSING (by design) | `docs/deployment/deployment.md` | Choose a host, then wire `.github/workflows/` deploy job | P2 | a chosen hosting target (business decision, not made yet) |
| Social sharing HTTP surface | MISSING (scaffold only) | `backend/src/modules/social-sharing` | Not in the master spec's required list — leave unless requested | P3 | — |
| Everything else in the master spec's Public/Attendee/Admin/Volunteer feature lists | COMPLETE | (see module inventory above) | — | — | — |

## Critical Gaps

1. **Real email sending has no configured credentials yet.** The provider code
   (`SmtpEmailProvider`) is implemented and auto-selected once `EMAIL_SMTP_HOST`
   is set, but no SMTP account has been provided/tested this session — until
   `.env` is filled in, the platform still falls back to logging emails instead
   of sending them.
2. **No E2E coverage** — the individual pieces are integration-tested, but the
   full attendee journey (register → verify → pay → get ticket → attend → get
   certificate) has never been exercised as one continuous flow.

Nothing found this pass rises to "blocks further implementation" — these are real
but bounded gaps, not architectural problems.

## Architecture Risks

None identified that would require a structural change. The modular-monolith +
three-SPA + shared-packages + single-Postgres design holds up under the full
feature set now built; nothing observed needs a queue, a second database, or a
service split. The one soft risk is operational, not architectural: a single Node
process is the whole API surface, so its restart/health strategy matters — this
was addressed this session (`/health` vs `/ready` split) but the platform has never
been load-tested.

## Implementation Dependency Graph

The graph in the master prompt already matches what was actually built, in
practice: Database → Domain services → Auth → Authorization → Registration →
Payment → Webhook → Ticket → Email → Attendee dashboard was the real build order
this project followed (confirmed via commit history), and Event Content → Admin
CMS → Public/Attendee portal and Event Activities → Volunteer → Attendance →
Achievements → Certificate eligibility → Certificate → Event Wrapped were both
also followed in that order. No reordering is recommended.

## Implementation Roadmap (revised for actual current state)

Given the audit above, most of the master prompt's 28-step roadmap is **already
done**. The remaining, re-ordered work:

1. Configure and verify real SMTP credentials in `.env` (P2 — code is done, this
   is filling in an account; refresh-token rotation and SmtpEmailProvider were
   both P1 and are now implemented — see above)
2. Admin attendee search/filter (P2 — parity with the other 8 admin lists)
3. Playwright E2E suite covering the master spec's 17-step flow (P2)
4. Remaining edge-case tests: session expiry mid-checkout, expired reset token,
   malformed/malicious input (P2)
5. Choose a deployment host, wire CD (P2 — business decision first)
6. Repo cleanup: delete the confirmed-dead scaffold directories, update the stale
   README status line (P3)
7. UI/UX polish, accessibility pass (P3 — explicitly last, per the master
   prompt's own "do not start UI polish" instruction in section 30)

Security hardening and performance review are folded into items 1-3 above rather
than treated as separate later phases, since nothing found in this audit needs a
dedicated hardening pass beyond what's already listed.

## P0/P1/P2/P3 Priorities

- **P0 (Critical):** none found — no broken core flow, no confirmed security
  hole.
- **P1 (High):** none open — refresh-token rotation and the SMTP `EmailProvider` were both P1 and are now implemented. Configuring real SMTP credentials in `.env` is a P2 (a config/business task, not code).
- **P2 (Medium):** admin attendee search; E2E suite; remaining edge-case tests;
  choosing + wiring a deployment target.
- **P3 (Low):** dead scaffold directory cleanup; README accuracy.

---

## Section 29/30 disposition

Per this phase's own rule ("do not stop at documentation... continue implementation
unless a genuinely ambiguous business rule would materially change the
architecture or data model"): no such ambiguity was found. The highest-priority
foundational gap is the real email provider (P1) — that is where implementation
continues next, starting with choosing an SMTP-compatible free/self-hostable
target and implementing `EmailProvider` against it, unless you'd rather direct
otherwise (e.g. if you have a specific SMTP relay/account you want used, since that
is exactly the kind of "which provider account" detail that isn't mine to assume).
