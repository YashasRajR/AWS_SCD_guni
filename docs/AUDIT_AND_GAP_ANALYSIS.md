# AWS Student Community Day 2026 — Repository Audit & Gap Analysis

**Date:** 2026-09-02
**Scope:** Phase 0 (Repository Audit) + Phase 1 (Requirements Traceability) of the Master Implementation Prompt.
**Method:** Six parallel read-only audits of the actual source (backend modules, database schema/migrations, security posture, all three frontend apps, test suites — actually executed — and observability/deployment config), cross-checked against the Master Prompt's requirements. Every finding below is backed by a specific file path; nothing here is inferred from memory of prior sessions.

No file was modified to produce this report.

---

## 1. Executive summary

The backend has a **solid, real foundation**: authentication, RBAC, the entire event-content CMS (speakers/sessions/agenda/timeline/venues/FAQs/announcements/event settings), the volunteer attendance workflow, the database schema, and core security controls (parameterized queries, per-route authorization, CORS allowlist, helmet, rate limiting, structured logging with secret redaction, a real `/health` check) are genuinely implemented and mostly test-covered — not stubs.

The **attendee monetary/completion lifecycle is not wired up**: Payments has no HTTP route at all (service/repository only), there is no webhook endpoint, Email never actually sends (tokens for verify/reset are generated then discarded), and Certificates / Achievements / Event Wrapped are read-only stubs with zero business logic. These are the pieces the Master Prompt calls out most heavily (Phases 6–8, 14–16), and today none of them function end-to-end. Nothing here fakes success — every stub is honest (returns empty/null, never fabricates data) — but "exists in the type system" is not the same as "works."

There is also no deployment target, no CI/CD, and no E2E test tooling.

The three frontend apps are in noticeably better shape than the backend gaps above would suggest, because they only call what exists — no mock data was found anywhere (`apps/web`, `apps/admin`, `apps/volunteer` all grep clean for mock/dummy/fake data patterns). They simply have no UI for the features the backend doesn't support yet (payment status, certificate/achievement management, event wrapped).

**QR/NFC: clean across the entire repository.** Every audit grepped independently; the only hits anywhere are deliberate "DO NOT add QR/NFC" comments in `tickets.repository.ts`, `database/schema/tickets.sql`, and one migration file, plus a policy line in `database/README.md`. No implementation exists.

---

## 2. Requirements traceability matrix (condensed)

| Requirement | Actor | Frontend | Backend module | API mounted? | DB | AuthZ | Tests | Status |
|---|---|---|---|---|---|---|---|---|
| Register / login / logout | Attendee | apps/web `RegisterPage`/`LoginPage` | `auth` | ✅ | `users`,`roles` | rate-limited, bcrypt+JWT | integration | **FUNCTIONAL** |
| Email verification | Attendee | — | `auth` | ✅ route exists | `users.email_verified` | — | none | **BROKEN** — token generated, never emailed (`auth.service.ts:54`) |
| Forgot/reset password | Attendee | — | `auth` | ✅ route exists | — | — | none | **BROKEN** — same as above (`auth.service.ts:102`) |
| Self-service registration | Attendee | apps/web `RegisterPage`→Dashboard | `user-dashboard`→`registrations` | ✅ `/me/registration` | `registrations` (CHECK-constrained status) | owner-scoped | none (no route-level test) | **FUNCTIONAL**, dup-prevention is app-level only |
| Payment | Attendee | — (no UI) | `payments` | ❌ **not mounted** | `payments` (schema ready) | — | none | **MISSING** |
| Payment webhook | Provider | n/a | `payments` | ❌ **doesn't exist** | — | — | none | **MISSING** |
| Ticket issuance | System | apps/web dashboard (read) | `tickets` (via `registrations.service`) | ✅ `/me/ticket` (read only) | `tickets`, unique on `registration_id` | owner-scoped | none | **FUNCTIONAL** (issuance), no own HTTP surface |
| Ticket email | Attendee | — | `emails` | queued, never sent | `email_records` | — | none | **BROKEN** — nothing ever consumes the queue |
| Admin: event/speakers/sessions/agenda/timeline/venues/FAQs/announcements | Admin | apps/admin `ContentCrudPage` ×8 | 8 modules | ✅ all | ✅ | permission-gated | integration (content-management) | **FUNCTIONAL** |
| Admin: registrations | Admin | apps/admin `RegistrationsPage` | `registrations` | ✅ status PATCH | ✅ | permission-gated | integration | **FUNCTIONAL** |
| Admin: payments | Admin | — (no UI) | — | ❌ | — | — | none | **MISSING** |
| Admin: certificates / achievements | Admin | — (count only) | stub modules | ❌ | ✅ schema | — | none | **MISSING** |
| Admin: user/role management | Admin | — | `users` (explicit stub) | ❌ **0 routes mounted** | — | — | none | **MISSING** |
| Admin: audit logs | Admin | apps/admin `AuditLogsPage` | `audit-logs` | ✅ | ✅ | `VIEW_AUDIT_LOGS` | none direct | **FUNCTIONAL**, coverage gaps noted below |
| Volunteer: search/verify/record attendance | Volunteer | apps/volunteer (3 pages) | `volunteers`+`checkpoints` | ✅ | ✅ (DB unique-index-backed) | permission-gated | integration (real 409/403 cases) | **FUNCTIONAL** |
| Attendee dashboard | Attendee | apps/web `DashboardPage` | `user-dashboard` | ✅ (registration/ticket/progress/certs/achievements) | ✅ | owner-scoped | none | **PARTIAL** — fetch errors swallowed; personal agenda + Event Wrapped endpoints exist but aren't called |
| Certificates | Attendee/Admin | count only | stub (`listForAttendee` only) | ❌ | ✅ schema, unique on number only | — | none | **MISSING** (no eligibility rule, no issuance) |
| Achievements | Attendee/Admin | count only | stub | ❌ | ✅ schema, unique `(attendee_id, achievement_id)` | — | none | **MISSING** (no rule engine) |
| Event Wrapped | Attendee | not rendered | stub, honest null | ❌ | ✅ schema | — | none | **MISSING** (no generation job) — correctly returns empty rather than fake data |
| Social sharing | Attendee | not rendered | stub, no auto-publish | ❌ | — | — | none | **STUBBED**, honestly (no false LinkedIn/Instagram claims) |
| Health / readiness | Ops | — | `/health` real DB check | ✅ | — | — | integration | **PARTIAL** — no separate `/ready` |
| CI/CD, deployment docs | Ops | — | — | — | — | — | — | **MISSING** entirely |
| E2E tests (17-step flow) | QA | — | — | — | — | — | 0 files, no Playwright/Cypress | **MISSING** |

---

## 3. Detailed findings by area

### 3.1 Auth & Registration
- Real bcrypt (12 rounds) + JWT, auth-specific rate limiter (20/15min) on register/login/forgot/reset. RBAC has `ADMIN`/`VOLUNTEER`/`ATTENDEE` — **no `SUPER_ADMIN`**, which the Master Prompt's RBAC list requires.
- **Email-verification and password-reset are broken end-to-end today**: `auth.service.ts:54` does `void verificationToken;` and line 102 does `void token;` — the token is generated, then discarded instead of being put in the email that's supposedly sent. Since email sending is also unimplemented (below), a user who registers can never verify their email or reset their password through the running system.
- Self-service registration works (`POST /me/registration`), but the `registrations` table's duplicate-prevention is **app-level check-then-insert only** — there's no DB unique constraint on `attendee_id`, so a race (two simultaneous submits) is not blocked at the schema level, unlike payments/tickets/attendance which all have real unique indexes.
- Multi-step writes (e.g., user+role+attendee creation on register) are not wrapped in a DB transaction — a mid-sequence failure can leave orphaned rows.

### 3.2 Payments — BLOCKER
- `backend/src/modules/payments/` has a service and repository but **no controller, no routes file, and is never mounted** in `routes/index.ts`. `paymentsService` only implements `getByRegistrationId`; `createPending`/`initiatePayment`/`handleWebhook` don't exist.
- The provider-agnostic interface (`integrations/payment/index.ts`) is well-designed (`createOrder`/`verifyWebhookSignature`) but has zero implementations — no Razorpay/Stripe/other adapter anywhere.
- No webhook endpoint exists at all. Registration confirmation today is 100% manual/admin-driven (`PATCH /admin/registrations/:id/status`), bypassing payment entirely — which is safe (no frontend-trust risk) but means there is no payment flow to test or ship.
- The `payments` table does already have the right idempotency guard ready for when a provider lands: `UNIQUE (provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL`.

### 3.3 Tickets — mostly sound, no surface of its own
- Issuance is genuinely idempotent at two layers (app-level existing-ticket check + a DB unique index on `registration_id`), so it's race-safe even without a queue/lock.
- Only reachable read-only via `GET /me/ticket`; no dedicated controller/routes, which is fine architecturally but means there's no ticket-resend endpoint etc.
- Tied only to registration status flipping to `CONFIRMED`, not to any payment state, since payment isn't wired in.

### 3.4 Email — BLOCKER
- `emailsService.enqueue` only inserts a `PENDING` row into `email_records` — there is no provider call anywhere, and `backend/src/jobs/` / `backend/src/queues/` are **empty directories**, so nothing ever consumes the queue. Rows sit forever.
- Of 10 templates defined in the type system, only 2 (`email-verification`, `password-reset`) are ever enqueued in code — and as noted above, even those are enqueued with the token thrown away rather than included. Registration-confirmation, ticket, payment-success/failed, and certificate-ready are never triggered anywhere.
- No transaction-boundary risk exists only because nothing wraps multi-step writes in a transaction to begin with (see 3.1) — email failure can't roll back a registration, but neither can any other failure roll it back safely.

### 3.5 Certificates / Achievements / Event Wrapped / Social Sharing — BLOCKER (all four)
- All four modules follow the identical pattern: a `service.ts` with one read method and an explicit code comment stating the real logic "lands in a later phase." No controller, no routes, nothing mounted.
- Critically, **none of them fake data**. Event Wrapped returns `null` rather than fabricated stats; social sharing makes no false claim of auto-publishing to LinkedIn/Instagram. This is the correct posture per the Master Prompt's "no fake production data" rule — it just means the features don't exist yet, honestly.
- Schema is mostly ready: achievements has the right `(attendee_id, achievement_id)` unique constraint; certificates has a unique certificate-number index but **no `(attendee_id, certificate_type)` unique constraint**, which will be needed once issuance is built to prevent double-issuing the same certificate type.

### 3.6 Admin content/ops modules
- Speakers, sessions, agenda, timeline, venues, FAQs, announcements, event settings, checkpoints, volunteers are all genuinely implemented: real CRUD, audit-logged writes, per-route `authenticate` + `requirePermission`/`requireRole` (verified against the actual middleware, not just route naming).
- **Uniform gap**: every one of these 9 admin list endpoints supports pagination only — no search, filter, or client-selectable sort, despite the Master Prompt requiring all three.
- Admin nav (`apps/admin`) shows every link to any signed-in admin regardless of their actual permissions — the backend correctly 403s unauthorized actions, so this isn't a security hole, just a UX gap (a volunteer-scoped admin, if that ever exists, would see links they can't use).
- User/role management (`modules/users`) is an explicit, intentional stub — zero endpoints mounted.

### 3.7 Volunteer portal — solid
- Full workflow (login → search → verify → select checkpoint → record → confirm → history) works end-to-end with real API calls.
- Attendee lookup is exclusively by name/email/registration-number search (no scanning of anything) — consistent with the No-QR/NFC rule.
- Duplicate-attendance prevention is genuine defense-in-depth: app-level pre-check *and* a DB partial unique index (`checkpoint_attendance_unique_completed`) as the race-safe backstop, with the resulting `23505` converted to a clean 409 and separately audit-logged as a duplicate attempt.
- Correctly exposes zero admin functionality (only 3 routes total).

### 3.8 Attendee dashboard (apps/web)
- Real data throughout — no mock/dummy content found anywhere in `apps/web/src`.
- **Swallows fetch errors**: `useResource().error` is available from the hook but never rendered for registration/ticket/progress/certificates/achievements — a genuine backend failure on any of these shows nothing to the user instead of an error state, which fails the Master Prompt's explicit "every page must have an error state" requirement.
- Two backend endpoints exist but are never called from the dashboard: personal agenda (`/me/sessions`) and Event Wrapped (`/me/event-wrapped`).
- Payment status can't be shown because there's nothing to show (3.2).

### 3.9 Security posture — strong where implemented
Checked directly against the Master Prompt's Phase 20 list: parameterized queries throughout (no string-concatenated SQL found), per-route authorization middleware verified on a representative sample, IDOR/BOLA protection via server-derived `req.identity.userId` (never client params) plus a `requireOwnUserId` guard, CORS is an explicit origin allowlist (not a wildcard), helmet is applied, secrets are env-var-only and `.env*` is gitignored, rate limiting covers all of `/api/v1` plus a stricter auth-specific limiter. The only genuine security gap is that webhook signature verification can't exist yet because there's no webhook route (3.2) — once payments land, this must be built before going live.

### 3.10 Testing — real where routes exist, absent where they don't
Actually executed (not just inspected): **backend 7 files / 40 tests, all passing**; **apps/web 7 files / 25 tests, all passing** (component-level only). `apps/admin` and `apps/volunteer` both have literal no-op test scripts (`"echo \"no tests yet\""`). No `backend/src/**/*.test.ts` unit layer beyond two files (error-code mapping, a duration helper) — domain-service unit tests don't exist because the domain services they'd cover (payments, certs, achievements) aren't wired up to exercise. **No Playwright/Cypress anywhere in the repo** — `tests/e2e/*` are empty directories. Existing security-scenario coverage is real (role-403s, duplicate-attendance-409, duplicate-checkpoint-name-409, duplicate-registration-email-409) but can't extend to tickets/certificates/payments ownership tests until those have routes.

### 3.11 Observability & deployment
Structured pino logging with real secret redaction (password/token/authorization/cookie fields), request-ID middleware, and a `/health` endpoint that does a real `SELECT 1` (not a static 200) are all genuinely implemented. **Missing**: a separate `/ready` endpoint, any deployment documentation or target (`docs/deployment/` and `infrastructure/deployment/` are empty directories, no Dockerfile, no PaaS config), and CI/CD (`.github/workflows/` exists but is empty). Env vars are fully documented and match the zod schema exactly.

---

## 4. Classified gap list

**BLOCKER**
1. Payments has no HTTP surface, no webhook, no provider implementation — the entire payment phase is unbuilt.
2. Email never actually sends (no provider integration, no worker consuming the queue) and the verify/reset tokens it should send are currently discarded — auth's verify-email and forgot-password flows are broken end-to-end right now, not just "incomplete."
3. Certificates, Achievements, and Event Wrapped are all unreachable via HTTP — no controllers/routes/business logic for any of the three.
4. No E2E test tooling exists at all; 11+ of the Master Prompt's 17-step flow have no backing route to test against regardless.
5. No deployment process or target is documented anywhere (empty `docs/deployment/`, `infrastructure/deployment/`, no CI/CD).

**HIGH**
6. No DB-level uniqueness on `registrations.attendee_id` — duplicate-registration prevention is app-check-only, inconsistent with payments/tickets/attendance which all have real unique indexes.
7. `SUPER_ADMIN` role is missing from the RBAC enum.
8. Admin has no UI for certificates or achievements management (issue/revoke/list) — only aggregate counts.
9. `DashboardPage.tsx` swallows fetch errors on 5 of its 6 data sections — a real failure renders nothing.
10. No search/filter/sort on any of the 9 admin content-management list endpoints (pagination only).
11. No CI/CD pipeline — no automated lint/test/build gate.
12. No readiness endpoint distinct from `/health`.
13. `apps/admin` and `apps/volunteer` have zero automated tests.

**MEDIUM**
14. Multi-step writes (e.g. auth's user+role+attendee creation) aren't wrapped in DB transactions.
15. Confirmation/ticket/payment-success/failed/certificate-ready email templates are defined but never triggered anywhere.
16. Certificates schema lacks a `(attendee_id, certificate_type)` unique constraint needed once issuance is built.
17. No user/role management surface (backend module is an intentional stub, unmounted).
18. Dashboard never calls the existing personal-agenda or Event-Wrapped endpoints.
19. No application-level rollback strategy (only DB migration rollback exists).
20. Audit logging is best-effort and silently swallows its own write failures.

**LOW**
21. Admin nav isn't permission-filtered client-side (backend still enforces correctly — UX-only gap).
22. `logger.ts`'s redact list doesn't yet include `secret`/`cvv`/`cardNumber` patterns (moot until payment integration lands, but should be added proactively).
23. `authenticateOptional` middleware is defined but unused anywhere.
24. Empty scaffold directories remain under `apps/web/src/{app,api,features,hooks,services,store,types,utils}` — harmless, zero files, cosmetic cleanup only.

**COSMETIC**
25. None beyond #24 — the codebase is otherwise clean of dead/orphaned implementation code (a prior orphaned-scaffold subtree found in an earlier pass has since been fully removed; only empty directory skeletons remain).

---

## 5. Implementation plan (dependency order)

Following the Master Prompt's own priority chain (Registration ✅ → **Payment** → **Tickets email/webhook tie-in** → **Email** → Admin ✅ → Volunteer ✅ → Attendee ✅ → **Attendance corrections** → **Certificates** → **Achievements** → **Event Wrapped** → **Testing** → **Security (webhook)** → Performance → UI/UX ✅ done → Accessibility ✅ done → **Deployment**), the concrete next slices, smallest-and-most-foundational first:

1. **Email integration** (unblocks two currently-broken auth flows and is a prerequisite for every later notification). Real provider adapter behind the existing `EmailProvider` interface, a worker/consumer for the `email_records` queue, and fixing `auth.service.ts` to actually include the verification/reset token in the email it sends.
2. **Payments**: controller + routes + a provider adapter behind the existing interface, a webhook endpoint with signature verification and idempotent event handling, wiring payment confirmation to registration status and ticket issuance.
3. **Registration hardening**: DB unique constraint (or partial unique on active status) on `attendee_id`; wrap the auth registration write sequence in a transaction.
4. **Certificates**: eligibility rule, idempotent issuance, unique-constraint addition, verification endpoint, admin management UI.
5. **Achievements**: data-driven rule engine, award-on-attendance triggering, admin management UI.
6. **Event Wrapped**: real generation job from attendee data, dashboard wiring.
7. **Dashboard error states**: render the `error` value `useResource` already returns for every section; wire the two unused endpoints (personal agenda, event wrapped).
8. **Admin UX**: search/filter/sort on the 9 content endpoints; permission-scoped nav.
9. **Testing**: unit tests for the new domain services (payment state machine, certificate eligibility, achievement rules), ownership tests for tickets/certificates once they have routes, E2E tooling (Playwright) covering the 17-step flow, minimal test coverage for apps/admin and apps/volunteer.
10. **Observability/deployment**: `/ready` endpoint, CI workflow (lint/typecheck/test/build), a real deployment doc and target, redact-list additions ahead of payment go-live.

Items are being tracked on the live task list and will be worked in this order; each will get its own audit-before-modify pass, migrations where schema changes, and tests before being marked done, per the Master Prompt's per-phase checklist.
