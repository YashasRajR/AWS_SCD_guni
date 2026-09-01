# Architecture overview

## Applications

Three independent React + Vite SPAs, one process each, sharing code only
through `packages/*`:

- **apps/web** — public event site + the authenticated attendee dashboard.
  The dashboard is part of this app (not a separate one) but every route
  under it requires a valid token — see `authentication.md`.
- **apps/volunteer** — mobile-first, single job: look up an attendee,
  verify them, mark a checkpoint complete.
- **apps/admin** — CMS for event content plus operational views
  (registrations, payments, checkpoints, volunteers, reports).

None of them hold business logic that matters for correctness or security
— that all lives in the backend. A frontend check (e.g. "hide the admin
link if not admin") is a UX nicety; the backend re-checks everything.

## Backend

One Express process, versioned routes under `/api/v1`, `/health` outside
both the API version and the rate limiter. Modules under
`backend/src/modules/<domain>` each own their slice end-to-end:

```
<domain>.routes.ts       — Express Router, wires middleware + controller
<domain>.controller.ts   — HTTP-shaped: reads req, calls service, writes res
<domain>.service.ts      — business rules, orchestrates repositories
<domain>.repository.ts   — the only place that writes SQL for this domain
<domain>.types.ts         — DB row shape + row -> API-type mapper
<domain>.schema.ts        — re-exports the zod schemas this domain validates against
index.ts                  — the module's public surface
```

A repository is the only thing allowed to import `pg`/run SQL for its
domain — services never construct queries, controllers never touch the
database. This keeps "where do I change the checkpoint-completion rule"
a one-file answer (`checkpoints.service.ts`).

## Database

PostgreSQL, plain SQL migrations, no ORM. See `database/README.md` for the
full design rationale and entity diagram.

## Request pipeline

```
request
  → helmet (security headers)
  → cors
  → pino-http (structured request logging, redacts secrets)
  → express.json (body parsing, 1mb cap)
  → rate limiter (general, or the stricter auth-specific one)
  → [per route] authenticate (JWT) → authorize (role/permission) → validate (zod)
  → controller → service → repository → PostgreSQL
  → consistent { success, data } / { success: false, error } envelope
  → central error handler (maps AppError -> status/code; hides internals in prod)
```

## Data flow: attendee dashboard

`GET /api/v1/me/progress` (as one example) never takes an attendee id from
the client. `authenticate` decodes the JWT into `req.identity`; the
controller calls `attendeesService.requireByUserId(req.identity.userId)`
to resolve the caller's own attendee row, then reads checkpoint progress
for that attendee only. There is no code path where a client-supplied id
can substitute for the authenticated identity on a `/me/*` route.

## What's modeled but not yet built

Payments, ticket issuance, certificate/achievement generation, Event
Wrapped statistics, and social-sharing image generation all have a
database table, a repository, and a service with the right method
signatures — but the actual business logic (talk to a payment gateway,
render a PDF, evaluate an achievement condition) is a later phase. See the
"What's modeled but not yet built" note in the root README for the current
list.
