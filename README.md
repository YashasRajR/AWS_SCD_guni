# AWS Student Community Day 2026

A mobile-first platform for AWS Student Community Day at Ganpat University:
a public event site, a personalized attendee dashboard, a volunteer
checkpoint portal, and an admin CMS, backed by one Node/Express API and one
PostgreSQL database.

**This repository intentionally contains no QR or NFC functionality** —
no QR/NFC dependencies, database tables, API endpoints, or UI components.
Attendee verification at checkpoints is done by name/registration-number
lookup through the volunteer portal.

## Project overview

Status: **foundation phase complete** (database, backend API, auth,
authorization, shared packages, and compiling frontend shells). The public
site, volunteer UI, admin UI, payments, certificates, achievements, Event
Wrapped, and social sharing are modeled in the database and, where noted
below, have a service boundary — but their business logic and UI are
future phases. See `docs/architecture/` for the full plan.

## Architecture

```
apps/web        Public site + personalized attendee dashboard (React + Vite)
apps/volunteer  Mobile-first volunteer checkpoint portal (React + Vite)
apps/admin      Admin CMS + operations portal (React + Vite)
backend         Express + TypeScript API (controller/service/repository per module)
database        PostgreSQL schema, migrations, seed data, migration runner
packages/*      Shared TypeScript: types, validation, constants, api-client,
                auth (RBAC helpers), config, utils, ui, eslint-config
```

Full detail: `docs/architecture/overview.md`, `database/README.md`.

## Applications

- **apps/web** — public event site (speakers, sessions, agenda, timeline,
  venues, FAQs) plus the authenticated attendee dashboard (`/me/*`).
- **apps/volunteer** — mobile-first: attendee lookup, assigned checkpoints,
  checkpoint completion, history.
- **apps/admin** — CMS and operations: registrations, attendees, payments,
  checkpoints, volunteers, reports.

All three are independent Vite SPAs sharing `packages/ui`, `packages/types`,
and `packages/api-client`. None of them talk to the database directly —
every read/write goes through the backend API.

## Backend

Express + TypeScript, one module per domain
(`backend/src/modules/<domain>/{controller,service,repository,routes,schema,types}.ts`).
Request pipeline: security headers (helmet) → CORS → request logging (pino)
→ rate limiting → route-level auth → authorization (role/permission) →
validation (zod) → controller → service → repository → PostgreSQL →
consistent `{ success, data | error }` JSON envelope.

Implemented this phase: auth (register/login/logout/forgot-password/
reset-password/verify-email), RBAC (roles, permissions, ownership checks),
event/speakers/sessions/agenda/timeline/venues/faqs/announcements (public
reads, plus full admin CRUD at `/admin/content/*` — see
`docs/architecture/authorization.md`), the full checkpoint-completion flow
(assignment check, duplicate prevention, audit logging) plus admin
checkpoint CRUD, volunteer self-service routes plus admin volunteer
management (promote a user, assign/revoke checkpoints), the attendee
dashboard aggregation (`/me/*`), and admin reads/writes (dashboard summary,
registrations incl. status update, attendees, audit logs).

Modeled with a data layer and service boundary, but no business logic or
external integration yet (see `backend/src/integrations/`): payments,
tickets (issuance), certificates, achievements, Event Wrapped, social
sharing, email delivery. Each has its own module so the later phase adds
logic in one place rather than restructuring.

## Database

PostgreSQL, no ORM — plain SQL migrations applied by a small custom runner.
29 tables covering identity/RBAC, the event content domains, registration/
payment/ticketing, checkpoints + attendance, volunteers, and certificates/
achievements/Event Wrapped/social shares/email records/audit logs. Full
design notes and the entity diagram: `database/README.md`.

## Environment setup

```bash
git clone <this repo>
cd student-community-day
npm install
cp .env.example .env   # then fill in DATABASE_URL and AUTH_SECRET at minimum
```

Requires Node 20+, npm 10+, and a running PostgreSQL 14+ instance. Create
the database first: `createdb scd_dev` (and `createdb scd_test` if you'll
run the test suite locally).

## Local development

```bash
npm run db:migrate      # apply the schema
npm run db:seed         # dev event, roles/permissions, checkpoints, fake dev accounts
npm run dev:backend     # API on :4000
npm run dev:web         # public site on :5173
npm run dev:volunteer   # volunteer portal on :5174
npm run dev:admin       # admin portal on :5175
```

Seeded dev accounts (password `DevPassw0rd!` for all — never real people):
`admin@dev.local` (ADMIN), `volunteer@dev.local` (VOLUNTEER, assigned to the
Registration checkpoint), `attendee1@dev.local` / `attendee2@dev.local`
(ATTENDEE).

## Database migration & seeding

```bash
npm run db:migrate          # apply pending migrations
npm run db:migrate:status   # see what's applied vs. pending
npm run db:migrate:down     # roll back the most recent migration
npm run db:seed             # idempotent — safe to re-run
npm run db:reset            # drop public schema, re-migrate, re-seed
```

Details and design rationale: `database/README.md`.

## Testing

```bash
npm test
```

Runs the backend's vitest suite (`tests/unit`, `tests/integration`) against
a dedicated `scd_test` database — a global setup resets, migrates, and
seeds it before the run, so tests never touch `scd_dev`. Covers: DB
connection, `/health`, password hashing, login/invalid-login, role and
permission authorization, attendee resource ownership, duplicate-email
rejection, and the full checkpoint-completion + duplicate-rejection flow.
Set `TEST_DATABASE_URL` to point it elsewhere.

## Building

```bash
npm run typecheck   # tsc --noEmit across every workspace
npm run lint        # eslint, zero warnings allowed
npm run build       # packages -> backend -> all three apps
```

`packages/*` build with `tsup` (bundled for completeness); the backend
build inlines all `@scd/*` workspace packages into one self-contained
`dist/index.js` (`npm start` after `npm run build`) since a plain `node`
process can't execute the packages' TypeScript source directly. The apps
build with `vite build`.

## Security

Passwords hashed with bcrypt, never returned by any API response. Access
control is enforced server-side only (JWT-based auth + role/permission
middleware) — the frontend is never trusted as a security boundary.
`/me/*` routes resolve data from the authenticated identity, never from a
client-supplied id. Rate limiting on all API routes (stricter on auth
endpoints). Structured logging redacts passwords, tokens, and auth headers.
Centralized error handling never leaks stack traces outside development.
See `docs/architecture/authentication.md` and `authorization.md`.

## No QR/NFC architecture

By design, this project has no QR code generation/scanning and no NFC
card/reader integration anywhere — not in the database schema, the API,
the backend services, or any frontend component. Checkpoint verification
is volunteer-driven: search an attendee by name/email/registration number,
confirm identity, mark the checkpoint complete.
