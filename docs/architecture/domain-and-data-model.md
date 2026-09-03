# Domain & Data Model

Phase 2 deliverable. Describes the platform's domain model, ownership
model, role model, and data-layer decisions as actually implemented in
this repository — not an aspirational design. Where the codebase already
had an equivalent of something the Phase 2 brief asked for, that's noted
as "already implemented" rather than rebuilt under a new name.

## 1. Domain model

Core entities and the table(s) that back them. Names in the brief that
don't match a table 1:1 are noted — the existing architecture's naming is
kept as the source of truth per Phase 2 rule #1 ("avoid creating duplicate
tables or models").

| Domain concept | Table(s) | Notes |
|---|---|---|
| User | `users` | Auth identity only — no profile fields. |
| Role / Permission | `roles`, `permissions`, `role_permissions`, `user_roles` | Fully data-driven; adding a role is a data change, not a migration (see §4). |
| Attendee | `attendees` | 1:1 with `users`; profile fields live here. |
| Registration | `registrations` | 1:1 with `attendees` (one active registration each, DB-enforced). |
| Payment | `payments` | 1:1-ish with `registrations` (latest row per registration). |
| Payment Event/Webhook | `payment_events` (new, migration 036) | Was previously *not* a persisted table — see §9. |
| Ticket | `tickets` | 1:1 with `registrations`. No QR/NFC fields. |
| Speaker | `speakers` | Event-owned content. |
| Session | `sessions`, `session_speakers` | Many-to-many speakers via join table. |
| Agenda Item | `agenda_items` | Not every row is a session — `session_id` is nullable, so breaks/custom items are a `title` + `start_time`/`end_time` with no session attached, per brief §11's "do not assume every agenda item is a session." |
| Timeline Item | `timeline` | |
| Venue | `venues` | |
| FAQ | `faqs` | |
| Announcement | `announcements` | |
| Event Activity | `checkpoints` | Pre-existing name for the brief's "Event Activity" concept — configurable rows (Registration, Breakfast, Lunch, ...), not hardcoded columns. Kept as-is rather than renamed, to avoid a purely cosmetic mass rename across a working module. |
| Attendance | `checkpoint_attendance` | Pre-existing name for "Attendance". `(attendee_id, checkpoint_id)` uniqueness enforced (see §13). |
| Certificate | `certificates` | |
| Achievement | `achievements` | |
| Achievement Rule | folded into `achievements.condition_type` + `condition_config` (JSONB) | No separate `achievement_rules` table — rule logic is a small set of domain conditions (`CHECKPOINT_COUNT`, `SESSION_COUNT`, `FULL_ATTENDANCE`, `MANUAL`) evaluated by `AchievementService`-equivalent code, not a generic rules engine. This matches the brief's own guidance in §17 ("avoid an unnecessarily complex generic rules engine if simple domain services are sufficient"). |
| Attendee Achievement | `attendee_achievements` | Unique `(attendee_id, achievement_id)`. |
| Event Wrapped | `event_wrapped` | See §18 — derived/cached, not a second source of truth. |
| Audit Log | `audit_logs` | |
| Event/System Settings | `events` | Single-row-per-edition typed table, not a generic key/value store (per brief §20's own preference). |
| Volunteer | `volunteers`, `volunteer_checkpoint_assignments` | Not in the brief's list but required for the volunteer role to function; kept. |

## 2. Ownership model

| Category | Entities | Create | Read | Update | Delete |
|---|---|---|---|---|---|
| User-owned | profile (`attendees`), `registrations`, `tickets`, `checkpoint_attendance` (own history), `attendee_achievements`, `certificates`, `event_wrapped` | Attendee (self, via `/me/*`) or system-triggered (ticket/certificate issuance) | Owner only, via `req.identity.userId` — never a client-supplied id (`requireOwnUserId` guard) | Owner (profile only) or system | Never hard-deleted (see §5) |
| Event-owned | `speakers`, `sessions`, `agenda`, `timeline`, `venues`, `faqs`, `announcements`, `checkpoints`, `achievements` | ADMIN/SUPER_ADMIN (permission-gated per module, e.g. `MANAGE_SPEAKERS`) | Public (PUBLISHED only) or ADMIN (all statuses) | ADMIN/SUPER_ADMIN | Soft (status → ARCHIVED); no hard delete route exists for any of these |
| Operational | `payments`, `payment_events`, `audit_logs`, `checkpoint_attendance` (recorder side), `user_roles` | System (payments/events) or VOLUNTEER (attendance) or SUPER_ADMIN (roles) | ADMIN (`VIEW_REPORTS`/`MANAGE_PAYMENTS`/`VIEW_AUDIT_LOGS`) or SUPER_ADMIN (`MANAGE_ROLES`) | Backend services only — never a raw PATCH endpoint | Never |

## 3. Role model (§4 of the brief)

Roles are rows in `roles`, not a hardcoded TypeScript union backed by a DB
enum — `ROLE_NAMES` in `packages/types/src/enums.ts` is the type-level
mirror. Adding **SUPER_ADMIN** this phase was therefore a data + permission
change, not a schema migration.

- **ATTENDEE** — no default permissions; everything it can do is scoped to
  its own resources via `/me/*` routes and `requireOwnUserId`.
- **VOLUNTEER** — `VIEW_ATTENDEE`, `COMPLETE_CHECKPOINT`. Cannot reach any
  `/admin/*` route (none of those routes grant these permissions).
- **ADMIN** — every permission except `MANAGE_ROLES`. Full operational
  control (content, registrations, payments, attendance corrections,
  certificates, achievements, settings, audit-log *viewing*).
- **SUPER_ADMIN** (new) — everything ADMIN has, plus `MANAGE_ROLES`: the
  exclusive ability to grant or revoke any role (including promoting
  another user to ADMIN or SUPER_ADMIN, or demoting one). This is the one
  concrete boundary the brief asks for explicitly ("ADMIN cannot perform
  SUPER_ADMIN-only actions") — implemented as a single new permission
  rather than scattering `role === 'SUPER_ADMIN'` checks through admin
  routes, consistent with the existing "check permissions, not roles"
  convention (see `packages/constants/src/permissions.ts`'s header
  comment).

  **Assumption made without a blocking round-trip** (stated here per the
  master prompt's own rule to proceed on defensible interpretations of
  non-cosmetic ambiguity rather than block): SUPER_ADMIN's exclusive
  scope is role/privilege escalation specifically, not a wider carve-out
  of ADMIN's existing operational permissions (settings, audit logs,
  etc. stay with ADMIN as before, so no existing ADMIN workflow
  regresses). If the intended boundary is broader, it now has exactly one
  extension point to adjust (`MANAGE_ROLES` in `ROLE_PERMISSION_SEED`),
  not a scattered one.

  Enforced end-to-end: `backend/src/modules/users/*` (new module —
  `GET/POST/DELETE /api/v1/admin/users*`), gated by
  `requirePermission(PERMISSIONS.MANAGE_ROLES)`. A SUPER_ADMIN cannot
  revoke the platform's last SUPER_ADMIN (transaction-locked check, see
  §29) — that would permanently strand role management with no way back.

- Role is never trusted from the frontend: every permission check reads
  `req.identity` as decoded from a *backend-verified* JWT
  (`middleware/authentication`), never a client-supplied role field.

## 4. Constraints (§21) — already-implemented inventory

Verified directly against `database/schema/*.sql` / `migrations/*.sql`
this phase (not assumed):

- Unique email: `users_email_unique` (implicit via `users.email` column +
  existing unique index from migration 001).
- Unique provider order/payment id: `payments_provider_order_id_unique`,
  `payments_provider_payment_id_unique` (partial unique indexes, `WHERE
  ... IS NOT NULL`).
- Unique webhook/provider event id: **new this phase** —
  `payment_events_provider_event_unique` on `(provider,
  provider_event_id)` (migration 036 — see §9).
- Unique ticket reference: `tickets_ticket_number_unique`; one ticket per
  registration via `tickets_registration_id_unique`.
- Unique certificate reference: `certificates_certificate_number_unique`;
  one ISSUED certificate per `(attendee_id, certificate_type)` via
  `certificates_attendee_type_issued_unique`.
- Unique attendance: `checkpoint_attendance_unique_completed` on
  `(attendee_id, checkpoint_id)` (partial, `WHERE status = 'COMPLETED'` —
  allows a REVERSED row to exist alongside a corrected COMPLETED one; see
  §6 below on corrections).
- Unique achievement award: `attendee_achievements_unique` on
  `(attendee_id, achievement_id)`.
- One active registration per attendee:
  `registrations_attendee_id_unique`.
- Valid FKs: every child table's `_id` column is a `REFERENCES ... ON
  DELETE {CASCADE|SET NULL}` — never a bare UUID column.
- Valid status values: every status/type column has a `CHECK (... IN
  (...))` constraint mirroring its TS string-union type in
  `packages/types/src/enums.ts` — status is never free text at the DB
  layer.
- Non-negative amounts: `payments.amount NUMERIC(10,2) NOT NULL DEFAULT
  0` — enforced by application validation (Zod, non-negative) at write
  time; a DB-level `CHECK (amount >= 0)` was not already present and is
  worth adding as a defense-in-depth follow-up (flagged as LOW in
  Remaining Issues — not blocking, since the only writers are trusted
  backend services, never client input).

## 5. Soft delete vs hard delete (§23)

Policy, confirmed against the actual schema rather than assumed:

- **Never hard-deleted**: `payments`, `payment_events`, `checkpoint_attendance`,
  `certificates`, `audit_logs`, `attendee_achievements`, `registrations`,
  `tickets`. None of these tables have a DELETE route in any module — the
  only way a row's state changes is a status transition (e.g.
  `certificates.status: ISSUED → REVOKED`,
  `checkpoint_attendance.status: COMPLETED → REVERSED`). This matches the
  brief's requirement directly: financial, attendance, certificate and
  audit history is retained forever.
- **Soft-deleted (status-based archival)**: `speakers`, `sessions`,
  `agenda`, `timeline`, `venues`, `faqs`, `announcements`, `achievements`
  — all use a `status` column (`DRAFT`/`PUBLISHED`/`ARCHIVED`) rather than
  a `deleted_at` column. An admin "delete" on these content types sets
  `ARCHIVED`; there is no destructive DELETE that removes the row.
- **Hard-deleted (acceptable)**: `user_roles` rows on revoke (§3) — a role
  grant/revoke is not history that needs to survive; the *fact that it
  happened* is what's audited (`ROLE_GRANTED`/`ROLE_REVOKED` in
  `audit_logs`, not the `user_roles` row itself).
- `users` has no delete path at all currently (`status` supports
  `SUSPENDED`/`DEACTIVATED` for account-level soft-disable, which is the
  correct mechanism — actual user deletion is out of scope for this
  phase and would need a data-retention/GDPR-style policy decision this
  brief doesn't ask for).

## 6. Timestamps and timezones (§24)

Confirmed by grepping every `database/schema/*.sql` file: **every**
timestamp column in the schema is `TIMESTAMPTZ` — there are zero naive
`TIMESTAMP` columns anywhere in the database. Postgres stores `TIMESTAMPTZ`
values normalized to UTC; the "TZ" only affects input/output conversion,
so this was already the correct canonical strategy — no migration was
needed to fix ambiguous local times because none existed.

What was missing was a single named constant for "what timezone is local
for this event" — added this phase:
`EVENT_TIMEZONE = 'Asia/Kolkata'` in `packages/constants/src/index.ts`.
The intended usage (not wired into UI this phase, since that's explicitly
out of scope — see brief §35): every place that *formats* a UTC timestamp
for a human (agenda times, certificate dates, event-wrapped copy,
email templates) should format with this constant via
`Intl.DateTimeFormat(..., { timeZone: EVENT_TIMEZONE })` rather than the
server's or browser's local timezone, which is not guaranteed to be IST.
`events.event_date` is deliberately a plain `DATE` (not `TIMESTAMPTZ`) —
it's a calendar date, not a moment in time, so timezone conversion doesn't
apply to it.

## 7. Migrations (§25)

36 migrations total as of this phase (was 35 — one new pair added:
`036_payment_events`). All migrations in this repository are:

- Ordered by a zero-padded numeric prefix, applied in order by
  `database/scripts/migrate.mjs`.
- Additive/repeatable: every migration this phase and prior phases only
  `CREATE TABLE`/`CREATE INDEX`/`ALTER TABLE ... ADD`, never `DROP COLUMN`
  or destructive rewrites, against a schema with no production data yet.
- Reversible: every `NNN_name.up.sql` has a matching `NNN_name.down.sql`.
- Reflected in application types immediately in the same change (row
  interfaces in each module's `*.types.ts`, shared enums in
  `packages/types/src/enums.ts`) — never left for "later".
- Verifiable via `migrate.mjs status` (existing tooling, unchanged).

**Not executed this phase**: `npm run db:migrate` against the real dev
database could not be run from this environment — the bridge shell has no
DNS/network route to the Neon host (`getaddrinfo EAI_AGAIN
...neon.tech`), a pre-existing limitation of this session disclosed in
every prior phase's report, not something introduced this phase. The test
suite's own `globalSetup` runs `migrate.mjs reset` + `seed.mjs` against a
*local* Postgres before every test run, which is the actual verification
path — also not executable from here for the same reason `npm test`
hasn't been executable all session (see §12). **The user needs to run
`npm run db:migrate` (or let the test suite's global-setup do it) against
their own reachable database before this schema change is live.**

## 8. Seed data (§26)

`database/scripts/seed.mjs` (idempotent, `ON CONFLICT`-safe, re-run-safe)
now also creates:

- The `SUPER_ADMIN` role and its permission grants (including the new
  `MANAGE_ROLES` permission row).
- One clearly-fake dev account: `superadmin@dev.local` / password
  `DevPassw0rd!` (identical placeholder password to every other seeded
  dev account — never a real credential).

Every seeded account continues to use an `@dev.local` email and the
script's existing header comment ("CLEARLY FAKE dev accounts") — nothing
here is or could be mistaken for production data, and no fake statistics
are seeded anywhere (checkpoints/roles/permissions are structural seed
data, not fabricated event outcomes).

## 9. Payment webhook idempotency (§9, §29) — the one real gap found

Before this phase, webhook idempotency relied **only** on checking
`payment.status` before reprocessing (`if (payment.status === 'PAID')
return;`) — correct in effect for the common case, but not what the brief
asks for: "the database must help prevent duplicate webhook processing"
and "provider event IDs should be unique where possible." There was no
persisted record of webhook deliveries at all, so a delivery that arrived
before the status check could observe a stale status (a narrow race) and
there was no audit trail of what webhooks were ever received.

Added: `payment_events` table (migration 036) with a
`UNIQUE (provider, provider_event_id)` index. `payments.service.ts`'s
`handleWebhook` now inserts a row for every delivery *before* doing any
processing, via `INSERT ... ON CONFLICT DO NOTHING RETURNING id`; a `NULL`
return means this exact event was already recorded, so the delivery is
a no-op at the database layer — before the payment-status check even
runs, not just because of it. The provider event id is `parsed.id` when
Razorpay supplies one, else a deterministic key derived from
`event:paymentEntityId:orderId` so an identical retried delivery still
collides. Every event is finalized as `PROCESSED`/`IGNORED`/`ERROR` for
observability (`payment_events.processing_status`).

## 10. Repository/service layers (§27)

Existing convention (confirmed, not changed): every domain module under
`backend/src/modules/<domain>/` already has its own
`<domain>.repository.ts` (pure persistence, parameterized SQL only) and
`<domain>.service.ts` (business rules, transactions, authorization-
adjacent decisions like "can this registration be cancelled"). This is
the brief's `RegistrationService`/`PaymentService`/... convention under a
per-module name rather than a single `services/` folder — the audit
flagged `backend/src/services` as empty legacy scaffolding for exactly
this reason (real logic lives in `modules/*`). New this phase:
`backend/src/modules/users/*` — previously a reserved-but-empty stub
(`export {}` placeholders with a comment "reserved... in a later phase"),
now implements the admin user/role-management the SUPER_ADMIN role needed
to be reachable at all.

## 11. Transactions & concurrency (§28–29)

Already-implemented (confirmed): registration creation, payment
confirmation → ticket issuance, and attendance recording all go through
`withTransaction` with the app-level check-then-insert-backed-by-a-unique-
constraint pattern, catching Postgres `23505` and mapping it to
`AppError.duplicate`. New this phase: **role revocation**
(`usersService.revokeRole`) runs inside `withTransaction`, locking the
target role's own row (`SELECT ... FROM roles WHERE name = $1 FOR
UPDATE`) before counting current holders — so two concurrent requests to
revoke the platform's last two SUPER_ADMINs can't both read "2 holders,
safe to proceed" and both succeed, leaving zero. (Postgres can't lock an
aggregate directly, hence locking the role row itself as the serialization
point — same technique the brief's example concurrency scenarios call
for.)

## 12. Verification run this phase

```
npm run typecheck --workspaces --if-present   # clean, all 13 packages
npx eslint . --max-warnings=0                 # clean, 0 errors/warnings
```

**Could not run** (pre-existing, disclosed every phase this session):
`npm test` and `npm run build` — the device bridge's mounted
`node_modules` was installed on Windows, so Linux-native binaries
(`@rollup/rollup-linux-x64-gnu`) required by `vitest`/`tsup`→`rollup` are
absent, and `npm install` was deliberately not run in the bridge to avoid
corrupting the user's real dev environment. `npm run db:migrate` could
not be run either, this phase specifically, because the bridge shell has
no network route to the Neon dev database.

**The user needs to run these locally before trusting this phase's
tests are green:**

```
npm run db:migrate
npm test
npm run build
```

New/changed test files this phase, verified by type-check + manual trace
only (same disclosed limitation as every prior phase):
`tests/integration/users/role-management.test.ts`,
`tests/unit/authorization/role-permission-seed.test.ts`,
`tests/unit/users/revoke-last-super-admin.test.ts`, and an added
duplicate-delivery case + updated mocks in
`tests/unit/payments/webhook-idempotency.test.ts`.

## 13. Data access rules (§30) — unchanged, confirmed still correct

`/me/*` routes derive the attendee/user id from `req.identity.userId`,
never a client-supplied id (`requireOwnUserId` guard, defense-in-depth on
top of that). `/volunteer/*` exposes only checkpoint-verification-scoped
fields (attendee name/registration number/checkpoint status — not
payment or full profile data). `/admin/*` is permission-gated per
module. The one addition this phase, `/admin/users/*`, follows the same
pattern (`requirePermission`), gated on the new `MANAGE_ROLES` permission
rather than a role string check.
