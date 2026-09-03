# Deployment guide

This platform has no infrastructure automation set up yet — no live
production host is configured, and this document does not claim otherwise.
It describes the recommended, actually-tested path: what to run, in what
order, and which environment variables each piece needs. CI (lint,
typecheck, build, unit tests, integration tests against a real Postgres)
runs on every push/PR via `.github/workflows/ci.yml`; continuous
*deployment* is intentionally not wired up until a host is chosen, so a CD
step here would be automating against nothing.

## Topology

Four independently deployable pieces, none of them needing anything
exotic:

| Piece | What it is | Where it can run |
| --- | --- | --- |
| `backend` | Express API (single Node process) | Any host that runs a long-lived Node process — a small VPS, Render, Railway, Fly.io |
| `apps/web` | Public + attendee portal (static SPA build) | Any static host — Netlify, Cloudflare Pages, or served from the same VPS via nginx |
| `apps/volunteer` | Volunteer portal (static SPA build) | Same as above |
| `apps/admin` | Admin portal (static SPA build) | Same as above |
| Database | Postgres | [Neon](https://neon.tech) (free tier, serverless, already what local dev points at) or any self-hosted Postgres 14+ |

This intentionally avoids containers/orchestration/microservices — one
Node process for the API, three static builds, one Postgres database — per
the project's "no unnecessary infrastructure complexity" rule.

## 1. Provision Postgres

Any Postgres 14+ works. Neon's free tier is the path already used for
local development (see the root `.env.example`) and needs no server to
manage. Whatever you use, you need its connection string as
`DATABASE_URL` (and `DATABASE_SSL=true` for a provider requiring TLS,
which Neon does).

## 2. Configure the backend's environment

The backend refuses to start with a clear, itemized error if anything
required is missing (`src/config/env.ts` / `@scd/config`'s `loadEnv`) —
there is no silent fallback to broken defaults. Required and notable
variables:

- `DATABASE_URL` — required.
- `AUTH_SECRET` — required, 16+ characters. Generate a fresh one for
  production; never reuse the value from `.env.example` or a dev machine.
- `PUBLIC_APP_URL`, `VOLUNTEER_APP_URL`, `ADMIN_APP_URL` — the deployed
  origins of the three frontends. These gate CORS (`src/server/app.ts`), so
  they must exactly match where each app is actually served.
- `PAYMENT_PROVIDER_KEY`, `PAYMENT_PROVIDER_SECRET`, `PAYMENT_WEBHOOK_SECRET`
  — Razorpay credentials. Left blank, payment initiation fails with a clear
  "not configured" error rather than faking a transaction (see
  `src/integrations/payment/unconfigured-provider.ts`) — fine for a
  content-only soft launch, not fine once registration needs to collect
  fees.
- `EMAIL_SMTP_HOST` / `EMAIL_SMTP_PORT` / `EMAIL_SMTP_USER` /
  `EMAIL_SMTP_PASSWORD` / `EMAIL_FROM_ADDRESS` — SMTP credentials. Left
  blank, the backend currently always uses the console provider (see
  `src/integrations/email/index.ts`) and only *logs* rendered emails
  instead of sending them — this was a deliberate scope decision earlier in
  the project, not a bug. **Before a real go-live, an SMTP-backed
  `EmailProvider` needs to be implemented and wired into `getEnv()`
  configured**; a free-tier relay (Brevo, Mailtrap) or a Gmail app password
  both work for a self-hostable choice.
- `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` — tune for expected
  traffic; defaults are conservative dev-mode values.
- `NODE_ENV=production`.

See `backend/src/config/env.ts` for the complete schema (every variable,
its default, and its validation) — that file is the single source of truth
for configuration; this doc summarizes it but can drift, that file cannot.

## 3. Run migrations, then start the backend

```bash
npm ci
npm run build --workspace=backend
DATABASE_URL=... npm run db:migrate      # idempotent — safe to re-run
npm run start --workspace=backend         # node dist/index.js
```

Run migrations as a separate, explicit step before starting the process —
never automatically on boot — so a failed migration is caught before
traffic is routed to a half-migrated schema. Run the backend under a
process supervisor (systemd, pm2, or the host's own process manager) so it
restarts on crash; point its restart health check at `GET /ready` (returns
503 while the database is unreachable) rather than `GET /health` (pure
liveness — always 200 while the process is up, deliberately independent of
the database so a transient DB blip doesn't trigger a restart loop).

## 4. Build and deploy the three frontends

```bash
VITE_API_URL=https://api.yourdomain.com/api/v1 npm run build --workspace=apps/web
VITE_API_URL=https://api.yourdomain.com/api/v1 npm run build --workspace=apps/volunteer
VITE_API_URL=https://api.yourdomain.com/api/v1 npm run build --workspace=apps/admin
```

Each produces a static `dist/` — upload it to a static host, or serve it
with nginx. `VITE_API_URL` defaults to `http://localhost:4000/api/v1` if
unset (see each app's `src/lib/api.ts`), so it must be set explicitly for
a production build or the deployed app will try to call `localhost`.

## 5. Seed reference/dev data — production caution

`npm run db:seed` creates the dev accounts (`admin@dev.local`,
`volunteer@dev.local`, etc.) and sample event content used by local
development and the integration test suite. Do **not** run it against a
production database — those accounts use a shared, publicly-known
password. Production event content (speakers, sessions, venues, ...)
should be entered once through the admin portal instead.

## Observability

- `GET /health` — liveness. Always 200 while the process is up. No
  dependency checks.
- `GET /ready` — readiness. 200 when the database is reachable, 503
  otherwise. Point uptime monitoring and any load-balancer health check
  here, not at `/health`.
- Structured JSON logs (pino) with per-request correlation IDs
  (`x-request-id`, echoed back in the response header) — pipe stdout to
  whatever log aggregation the host provides.
- The logger's redact list (`src/utils/logger.ts`) strips passwords,
  tokens, payment provider secrets, and card fields before anything is
  logged — review it if a new field is added anywhere that could carry a
  secret.

## What's deliberately not here yet

- No CD (auto-deploy on merge) — added once an actual host is chosen; a
  workflow that deploys to nowhere would be exactly the kind of fake
  functionality this project avoids.
- No SMTP-backed `EmailProvider` — see step 2. The console provider is a
  correct, working choice for development and a pre-payment content
  launch; it is not correct for a live event with real attendees waiting
  on confirmation emails.
- No container/orchestration layer — deliberately, per the project's
  "avoid unnecessary infrastructure" rule. Revisit only if a single Node
  process genuinely can't handle event-day load, not preemptively.
