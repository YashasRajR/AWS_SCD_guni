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
  `EMAIL_SMTP_PASSWORD` / `EMAIL_FROM_ADDRESS` — SMTP credentials.
  `SmtpEmailProvider` (`src/integrations/email/smtp-provider.ts`, via
  nodemailer) is implemented and picked automatically once
  `EMAIL_SMTP_HOST` is set; left blank, the backend falls back to the
  console provider and only *logs* rendered emails instead of sending
  them. **This platform has not had real SMTP credentials configured or
  tested end-to-end yet** — set these before go-live. A free-tier relay
  (Brevo, Mailtrap) or a Gmail app password both work as a self-hostable
  choice.
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
- SMTP credentials are not yet configured/tested against a real mailbox
  — the provider code exists (`SmtpEmailProvider`) but `.env`'s
  `EMAIL_SMTP_*` values need to be filled in and verified before real
  attendees can receive confirmation/ticket/certificate emails.
- No container/orchestration layer — deliberately, per the project's
  "avoid unnecessary infrastructure" rule. Revisit only if a single Node
  process genuinely can't handle event-day load, not preemptively.

## 6. SPA hosting: client-side routing and caching

Each app's `public/` directory now ships two host-config files that Vite
copies into `dist/` verbatim:

- `_redirects` (Netlify / Cloudflare Pages format) — `/* /index.html 200`,
  so a hard refresh or direct link on a client-side route (`/speakers`,
  `/dashboard`, `/ticket`, ...) is served `index.html` instead of 404ing.
  Before this was added, none of the three apps had any SPA-fallback
  config anywhere in the repo — deploying any of them as-is to a static
  host with default settings would have 404'd every route except `/`.
- `_headers` — long-lived immutable caching (`max-age=31536000,
  immutable`) for the content-hashed files under `/assets/` (Vite names
  them e.g. `index-C3010A5p.js`, so a new deploy is a new filename), and
  `no-cache` on `index.html` itself so a deploy is actually picked up by
  returning visitors instead of being served a stale cached shell.

If serving via nginx on a VPS instead of Netlify/Cloudflare Pages, the
equivalent config is:

```nginx
server {
  listen 443 ssl http2;
  server_name your-app.example.com;
  root /var/www/apps/web/dist;   # or volunteer/admin's dist

  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  location / {
    add_header Cache-Control "no-cache";
    try_files $uri /index.html;   # SPA fallback
  }
}
```

None of this has been tested against a real deployed host yet — no host
is chosen (see top of this document). It has been verified only by
inspecting the built `dist/` output structure and confirming Vite's
default hashing/asset-copy behavior.

## 7. Backup and restore

Whichever Postgres provider is chosen, backups are the provider's
responsibility to run — this project does not (and should not) roll its
own backup daemon. What this section documents is the *procedure*, not a
claim that it has been exercised:

- **Neon** (the free tier already used for local dev): point-in-time
  restore is available on paid plans; the free tier keeps a much shorter
  history — check Neon's current retention window for your plan before
  relying on it, and treat "the free tier has backups" as insufficient on
  its own for an event you can't re-run.
- **Self-hosted Postgres**: schedule `pg_dump` (or `pg_basebackup` for
  larger data) on a cron, ship the dump off-box (object storage, not the
  same disk), and encrypt it at rest if the storage doesn't already.

**Restore procedure (run this against a scratch database, not
production, to verify it actually works before trusting it):**

```bash
# 1. Create a throwaway database from the backup.
createdb scd_restore_test
pg_restore -d scd_restore_test path/to/backup.dump   # or: psql -d scd_restore_test < backup.sql

# 2. Point a local backend at it and sanity-check row counts / a few
#    known records match what the backup was taken from.
DATABASE_URL=postgres://.../scd_restore_test npm run db:migrate:status --workspace=root
```

**This restore procedure has not actually been run in this session** —
doing so needs a real backup file from a chosen provider, which does not
exist yet. Recording "backups are configured" without having restored one
at least once is exactly the unverified claim Phase 8's spec asks not to
make; treat backup/restore as **unverified** until someone runs the steps
above against a real backup and confirms the restored data matches.

Document, once a provider is chosen and this has actually been run:
backup frequency, retention window, who is responsible for verifying a
restore before the event, and the measured time the restore above took
(a stand-in for recovery time objective).

## 8. Rollback

- **Frontend**: redeploying the previous build is the rollback — static
  hosts (Netlify/Cloudflare Pages) keep prior deploys and can re-point
  the live alias to one in a couple of clicks/one CLI command; on a VPS,
  keep the previous `dist/` directory until the new one is confirmed
  healthy and swap a symlink back.
- **Backend**: keep the previous build artifact (or previous git tag)
  deployable; redeploy it and restart the process under the same
  supervisor. Because there is no CD pipeline yet (see "What's
  deliberately not here yet" above), rollback today is "redeploy the
  last known-good commit by hand," which is fine at this project's scale
  but should be written down so it isn't improvised during an incident.
- **Database migrations**: this is the part that can't be rolled back by
  redeploying old code if a migration already ran and the old code isn't
  compatible with the new schema. Follow the additive-first pattern
  already used by every migration in `database/migrations` (add new
  columns/tables before removing old ones; never drop a column the
  previous app version still reads) so that rolling back the
  *application* to the previous version never requires rolling back the
  *schema* too. If a migration ever must be destructive, deploy it in two
  releases: first add-and-backfill, verify, then remove-old-column in a
  later release once nothing still depends on it.
- Payment/ticket/attendance/certificate state must never be rolled back
  by reverting the database — those are facts about what already
  happened (a payment was received, a ticket was issued). A bad
  deployment is fixed by rolling the *application code* forward or back;
  it is not fixed by rewinding data that reflects real user actions.

This rollback plan has been reasoned through against the actual schema
and migration mechanism in this repo, but — like backup/restore above —
has not been executed against a real deployment, because none exists yet.
