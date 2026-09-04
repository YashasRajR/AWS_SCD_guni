# Operational runbook

Procedures for operating this platform once it has a real host. Written
against the actual code in this repo (routes, scripts, env schema) — not
an imagined architecture. Nothing here has been exercised against a live
deployment yet, because no production host is chosen (see
`deployment.md`); treat this as the plan to follow and verify once one is.

## Start

1. `npm ci && npm run build` (all workspaces).
2. `DATABASE_URL=... npm run db:migrate` — idempotent, safe to re-run.
3. `npm run start --workspace=backend` under a process supervisor
   (systemd/pm2/host-native), restart policy on crash.
4. Verify: `curl https://api.yourdomain.com/health` (200, always) then
   `curl https://api.yourdomain.com/ready` (200 once DB is reachable).
5. Deploy the three static `dist/` builds (see `deployment.md` §4) to
   their hosts.
6. Smoke test (see below) before announcing the deploy is live.

## Stop

- Send `SIGTERM` (or let the host's deploy tooling do it) — `server/index.ts`
  already handles graceful shutdown: stops the email-reminder worker,
  closes the HTTP server to new connections, closes the DB pool, force-
  exits after 10s if something hangs. No separate "maintenance mode" flag
  exists in this codebase; a full stop means the API is down.

## Rollback

See `deployment.md` §8. Summary: redeploy the previous frontend build /
previous backend build; only roll back a database migration if the
previous app version is actually compatible with the pre-migration
schema (check the migration's own `.down.sql` and what changed).

## Incident: Backend down

1. Detect: `/health` stops responding, or uptime monitoring alerts.
2. Inspect: process logs (structured JSON via pino — look for the last
   `error`-level entries and the correlation ID of any request in
   progress when it went down).
3. Restart under the supervisor; if it won't stay up, check `getEnv()`
   didn't just get a bad config change (it throws a readable error on
   startup rather than starting broken).
4. Verify `/health` then `/ready` before considering it resolved.

## Incident: Database down

1. Detect: `/ready` returns 503 (`database: "disconnected"`); `/health`
   keeps returning 200 (deliberate — this rules out "the whole process is
   down" and narrows it to the DB).
2. Check the provider's own status page/dashboard first.
3. If self-hosted: check the DB host is reachable, disk isn't full,
   connection count isn't maxed (pool `max: 10` per backend instance —
   if running multiple instances, check the provider's own connection
   cap isn't exceeded).
4. Once reachable again, `/ready` recovers on its own (no restart of the
   backend needed — `checkDatabaseConnection()` re-checks live).

## Incident: Payment failure

1. Check Razorpay's dashboard/status page for a provider-side outage.
2. Check backend logs filtered to the payments module for signature
   verification failures or webhook processing errors (the raw payload is
   never logged — see `src/utils/logger.ts`'s redact list — so this is
   metadata: event type, registration ID, outcome, not card/payment
   details).
3. Cross-check: does the payment's status in Razorpay's dashboard match
   `payments` table's `status` for that `provider_payment_id`? If Razorpay
   shows "captured" but the local row is still `pending`, the webhook
   likely didn't arrive or failed — Razorpay retries webhook delivery
   automatically; if retries are exhausted, replay the specific event
   manually from Razorpay's dashboard.
4. Never manually mark a payment "paid" in the database without
   confirming the funds actually settled in the provider dashboard first.

## Incident: Email failure

1. Check the configured SMTP provider's own status/deliverability
   dashboard.
2. The ticket/registration state in the database is authoritative
   regardless of whether the email sent — a failed confirmation email
   does not mean the registration or payment failed. Verify state via the
   admin portal / DB, not by "did they get the email."
3. Once the provider recovers, there is no automatic re-send queue in
   this codebase for a message that failed once — a stuck attendee should
   be told to check their dashboard/ticket page directly, or an admin can
   re-trigger the relevant action if the codebase's admin tools support it.

## Incident: Authentication abuse

1. The auth-sensitive routes already sit behind a stricter rate limiter
   (20 req/15min) than the general API limiter — check logs for repeated
   `429`s from a single IP/account first.
2. If a specific account is compromised or being abused, disable it via
   the admin portal (account `status`) — `middleware/authentication`
   re-checks status on every request, so this takes effect immediately,
   not at the token's natural expiry.
3. Preserve the relevant log lines (they already carry request IDs and
   timestamps) before they roll off whatever retention the host's log
   aggregation uses.

## Incident: Bad deployment

1. Stop rolling out further (don't deploy on top of a known-bad build).
2. Roll back per the Rollback section above.
3. Re-run the smoke tests below against the rolled-back version before
   declaring it resolved.

## Smoke test (run after every deploy)

Public: `/`, `/speakers`, `/sessions`, `/agenda`, `/timeline`, `/venues`,
`/faq`, `/register` all load and don't 404 on a direct link (this is what
the new `_redirects` files fix).
Auth: register/login/logout round-trip once with a throwaway account.
Attendee: dashboard, ticket, certificate/achievement pages load.
Volunteer: login, attendee search, one attendance record.
Admin: login, dashboard, one CRUD action.
Backend: `/health` → 200, `/ready` → 200, one authenticated API call.

This list has not been run against a live deployment in this session —
there isn't one yet. It's written so it can be run mechanically (by a
person, or scripted later) the first time there is.

## Event-day checklist

**Infrastructure**: domain resolves, HTTPS cert valid, `/health` and
`/ready` both green, database provider status page green, SMTP and
Razorpay provider status pages green.

**Accounts**: real admin accounts exist and their passwords aren't the
seed script's shared dev password (`npm run db:seed` must never have been
run against production — see `deployment.md` §5); volunteer accounts
provisioned for actual volunteers; any leftover test/dev accounts removed
or disabled.

**Event content**: speakers, sessions, agenda, timeline, venues, FAQs,
activities entered through the admin portal and spot-checked on the
public site.

**Registration**: registration flow tested end-to-end with a real (small)
payment in test/live mode per the provider's own verification process;
confirmation email actually received, not just logged.

**Attendance**: a volunteer account walks through search → verify →
select activity → submit at least once against production data before
the event starts.

**Certificates**: eligibility rule and template checked against at least
one real eligible attendee.

**Monitoring**: whatever uptime/log monitoring is set up is actually
receiving data (send a deliberate test alert, don't assume silence means
"working").

None of these have been checked off in this session — they require a
live deployment and real provider accounts that don't exist yet. This
checklist is the thing to run through once they do.
