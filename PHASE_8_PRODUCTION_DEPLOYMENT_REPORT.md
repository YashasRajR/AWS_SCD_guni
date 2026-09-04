# Phase 8 — Production Deployment, Launch Readiness, Observability & Operational Runbook

**Final decision: NOT PRODUCTION READY.**

This is not a statement that the code is broken. It is that no production
host, domain, or live payment/email/storage provider has been chosen yet
(confirmed against this repo's own `docs/deployment/deployment.md`, which
says so explicitly), and Phase 8's spec is largely a checklist of things to
verify *against a live deployment* — health endpoints under real load,
webhook behavior against a real provider, a real backup actually restored,
DNS/HTTPS from a real browser, event-day traffic simulation. None of that
exists to verify yet. Claiming otherwise would be exactly the fabrication
the spec explicitly forbids.

What this report *does* cover, honestly: everything in Phase 8's checklist
that is actually checkable from the repository itself, without a live
deployment — and one real, concrete deploy-blocking gap that was found and
fixed.

---

## 0. Same environment constraint as Phase 7

This session works through a shell in an isolated Linux VM, not your real
Windows machine, and has no way to provision a domain, a hosting account,
or a live payment/email sandbox. `vite`/`vitest`/`tsup` builds still fail
here specifically (`@rollup/rollup-linux-x64-gnu` missing) — your machine
builds them fine, confirmed in Phase 7. Nothing below claims a build ran
successfully in this session unless it's the plain `tsc`/`eslint`/`node`
checks that don't depend on Rollup.

---

## 1. The one real gap found and fixed: no SPA hosting configuration existed

**P1 — every one of the three frontends would 404 on any route except `/`
once deployed to a static host with default settings.**

Checked all three apps' `public/` directories (which Vite copies verbatim
into `dist/`) and the whole repo for `netlify.toml`, `vercel.json`,
`_redirects`, `render.yaml`, or any nginx config: none existed, anywhere.
A client-rendered route like `/speakers`, `/dashboard`, or `/ticket` only
exists in the browser's JS router — a static host that doesn't know to
fall back to `index.html` for unmatched paths returns a real 404 the
moment someone refreshes the page or opens a direct link, which is exactly
how attendees will reach these pages (shared links, bookmarks, browser
back/forward).

**Fix**: added `_redirects` (Netlify/Cloudflare Pages SPA-fallback syntax)
and `_headers` (immutable caching for Vite's content-hashed `/assets/*`
files, `no-cache` on `index.html` so deploys are actually picked up) to
`apps/web/public/`, `apps/volunteer/public/`, and `apps/admin/public/`,
plus the equivalent nginx `location` blocks documented in
`docs/deployment/deployment.md` §6 for a VPS deployment instead. Verified
by inspecting an actual `npm run build --workspace=apps/web` output
(`dist/assets/index-C3010A5p.js`, confirms Vite's hashing convention these
files rely on) — not yet verified against a real deployed host, because
none exists.

No other deploy-blocking code defect was found in this pass — see below
for what was reviewed and passed.

---

## 2. What was audited and found already correct (no change needed)

- **Environment validation** (`backend/src/config/env.ts`): `DATABASE_URL`
  and `AUTH_SECRET` are hard-required — the process refuses to start with
  a readable itemized error, not a stack trace, if either is missing.
  Payment/SMTP credentials are intentionally optional (a documented
  "content-only soft launch" mode) and already log a clear startup
  warning when left blank (`integrations/payment/index.ts`,
  `integrations/email/index.ts`) rather than silently pretending to work.
  This matches §3/§6's intent; it is a deliberate feature, not an oversight.
- **Health vs. readiness** (§23): already split correctly —
  `GET /health` is pure liveness (always 200 while the process is up,
  no dependency checks, so a DB blip doesn't trigger a restart loop);
  `GET /ready` checks the database and returns 503 when disconnected.
  Exactly the pattern the spec asks for.
- **Graceful shutdown** (§6): `server/index.ts` handles `SIGTERM`/`SIGINT`,
  stops the background email worker, closes the HTTP server, closes the
  DB pool, and force-exits after 10s if something hangs.
- **Migrations** (§7/§8): `database/scripts/migrate.mjs` is versioned,
  transactional per migration, tracked in a `schema_migrations` table,
  applies only pending migrations in filename order — re-running `up` is
  a no-op once caught up. This is the correct mechanism already.
- **Database pooling** (§7): `max: 10`, 30s idle timeout, SSL configurable
  via `DATABASE_SSL`, a pool-level error handler that logs instead of
  crashing the process on a background connection error.
- **No QR/NFC regression** (§37): re-ran the repo-wide search for
  QR/NFC/barcode/scanner terms. Only hit: the same guardrail comment in
  `tickets.repository.ts` from Phase 7 (`// DO NOT add QR/NFC fields
  here`). Nothing new introduced.
- **Secrets in frontend bundles** (§29): grepped every `import.meta.env.*`
  usage across all three apps — the only one referenced anywhere is
  `VITE_API_URL`, which is meant to be public. No secret-shaped variable
  is read by any frontend.
- **CI pipeline stages** (§31): lint → typecheck → build already run as
  one job; a separate DB-free unit-test job; a separate job that spins up
  a real Postgres service container and runs the full integration suite.
  Added: an `npm audit --audit-level=high` step (informational —
  `continue-on-error: true`, because Phase 7 found 4 existing
  vulnerabilities not yet remediated, and a hard-blocking gate today would
  fail every unrelated PR; tighten to blocking once those are fixed). CI
  still has no CD/deploy stage — correctly so, per `deployment.md`'s own
  stated reasoning: automating deployment to a host that doesn't exist
  yet would itself be fake functionality.
- **Empty `infrastructure/{database,deployment,email,monitoring,security,storage}`
  directories**: confirmed still empty scaffolding (only `README.md` at
  the top level has content), unchanged since Phase 7. Not a defect —
  just not yet used for anything.
- **Frontend `public/` asset directories** (favicon/fonts/icons/images/logos
  under each app): confirmed these are genuinely empty — no logo/favicon
  files exist yet, in git or on disk. Not a build defect (nothing
  references files that don't exist), but worth noting as an open content
  task before launch: the deployed apps currently ship the browser's
  default favicon.

---

## 3. Section-by-section verification status (per §40.D's required format)

| Category | Status | Evidence |
|---|---|---|
| Repository deployment audit (§2) | **PASS** | Root/backend package.json, tsup config, CI workflow, infra dirs all read directly; one gap found and fixed (§1 above) |
| Environment configuration (§3) | **PASS** | `env.ts` schema reviewed; no secret-shaped var exposed to any frontend bundle; `.env.example` already has purpose comments and placeholders, no real secrets |
| Production build verification (§4) | **PARTIAL** | Confirmed `apps/web`'s actual `dist/` output structure (hashing, asset layout) from an existing local build. Could not run a fresh build of all four workspaces in this session (Rollup native-binary limitation, §0) — Phase 7 already had you run `npm run build` successfully on your machine across all workspaces; not re-run this session |
| SPA hosting (§5) | **FIXED, UNVERIFIED LIVE** | `_redirects`/`_headers` added to all three apps; nginx equivalent documented. Not tested against a real deployed host |
| Backend production startup (§6) | **PASS** | Required-var validation, health/ready split, graceful shutdown all confirmed by reading the actual code |
| Database production readiness (§7) | **PASS** (mechanism) / **BLOCKED** (live SSL/provider-specific check) | Pooling, SSL toggle, migration mechanism all correct; actual TLS behavior against a real production Postgres provider not tested (no provider chosen) |
| Migration deployment strategy (§8) | **PASS** (mechanism) | Additive-first guidance documented in `deployment.md` §8; the mechanism itself (versioned, transactional, idempotent) was already correct |
| Backup and recovery (§9) | **BLOCKED** | Procedure documented in `deployment.md` §7; explicitly **not executed** — no backup file exists yet to restore, because no provider is chosen. Do not read the documentation as "backups verified" |
| Disaster recovery (§10) | **DOCUMENTED, UNTESTED** | Per-incident procedures written in `docs/deployment/runbook.md`; none exercised against a real incident or staging environment |
| Rollback strategy (§11) | **DOCUMENTED, UNTESTED** | `deployment.md` §8 — additive-migration discipline plus redeploy-previous-build procedure; not exercised, since there is nothing deployed to roll back |
| Payment production readiness (§12) | **BLOCKED** | Code path reviewed and confirmed correct in Phase 7 (signature-verified webhook, DB-insert-first dedup, server-computed amounts). No live/test Razorpay account connected in this session to run an actual end-to-end payment |
| Payment webhook operations (§13) | **BLOCKED** | Same as above — idempotency logic reviewed and correct; duplicate/malformed/out-of-order event handling not exercised against a real webhook delivery |
| Email production readiness (§14) | **BLOCKED** | `SmtpEmailProvider` exists and is wired up; per `deployment.md`, no real SMTP credentials have ever been configured or tested end-to-end |
| Storage production readiness (§15) | **NOT APPLICABLE** | No object/file storage is used by this codebase (`STORAGE_BUCKET` env var exists but nothing reads/writes to it currently — grepped, no usage found) |
| Domain and HTTPS (§16) | **BLOCKED** | No domain registered, no host chosen — cannot test from a real browser |
| Authentication production validation (§17) | **PARTIAL** | Auth logic reviewed and confirmed correct in Phase 7 (status re-checked every request, not just at login); not re-run against a live deployment this session |
| RBAC production validation (§18) | **PARTIAL** | Server-side role/permission/ownership checks reviewed and confirmed in Phase 7; not re-exercised against a live deployment |
| Manual attendance production validation (§19) | **BLOCKED** | Requires a live volunteer workflow on a real mobile browser against a deployed instance |
| Event activity operations (§20) | **NOT RE-VERIFIED** | Reviewed in earlier phases; not re-run this session |
| Admin production safety (§21) | **PASS** (code) | No separate "bootstrap admin" mechanism exists in the backend — the only hardcoded credential anywhere is `database/scripts/seed.mjs`'s `DevPassw0rd!`, which is dev-only seed data already documented as forbidden to run against production (`deployment.md` §5). A production admin account has to be created deliberately (by an existing admin, or directly in the database), not auto-provisioned with a known password |
| Observability (§22) | **PARTIAL** | Structured JSON logging (pino) with request correlation IDs and a secret-redaction list already exist. No external log aggregation/alerting is wired up — there is nowhere to ship logs to yet, since no host is chosen |
| Health/readiness endpoints (§23) | **PASS** | See §2 above |
| Monitoring and alerts (§24) | **BLOCKED** | Cannot configure alerts against infrastructure that doesn't exist yet |
| Event-day operational readiness (§25) | **BLOCKED** | No load test run this phase (a prior conversation already answered "can it handle 1000 concurrent users" via code-level reasoning only, explicitly disclosed as unmeasured) |
| Graceful failure during event day (§26) | **PARTIAL** | Idempotency patterns (payment webhook dedup, ticket/certificate unique-constraint-plus-refetch) reviewed and correct in Phase 7; not exercised live |
| Deployment smoke tests (§27) | **DOCUMENTED, UNRUN** | Checklist written in `runbook.md`; nothing to run it against yet |
| Security post-deployment verification (§28) | **BLOCKED** | Requires a deployed environment |
| Frontend production verification (§29) | **PASS** | See §2 above |
| Performance baseline (§30) | **BLOCKED** | Requires a live deployment to measure |
| CI/CD deployment pipeline (§31) | **PARTIAL** | Test/build/lint/typecheck stages exist and are enforced; audit stage added this session (informational only for now); no deployment stage exists (correctly, per `deployment.md`'s reasoning — nothing to deploy to yet) |
| Deployment safety (§32) | **NOT APPLICABLE YET** | No deployment platform chosen to pick a rollout strategy for |
| Operational runbook (§33) | **DONE** | `docs/deployment/runbook.md` created this session |
| Event-day checklist (§34) | **DONE** | Included in `runbook.md` |
| Post-deployment data verification (§35) | **NOT APPLICABLE YET** | Nothing deployed |
| Production data integrity (§36) | **NOT RE-VERIFIED** | Unique-constraint/idempotency invariants reviewed in Phase 7; a diagnostic script was not requested and wasn't written this session |
| No QR/NFC regression (§37) | **PASS** | See §2 above |
| Documentation (§38) | **PARTIAL** | `deployment.md` extended (§6-§8: SPA hosting, backup/restore, rollback); `runbook.md` added. Payment/email/storage *setup* docs (as opposed to the app's existing config) can't be written meaningfully until a provider account is chosen |
| Final production readiness gate (§39) | **BLOCKED** | Cannot run E2E/security/accessibility/dependency-audit-as-a-gate/deployment-smoke-tests/payment-verification/email-verification against something that isn't deployed |

---

## 4. Security status

No new vulnerability found this phase. The 4 findings from Phase 7's
`npm audit` (esbuild dev-server file-read on Windows — dev-only, low; a
`qs`/`body-parser`/`express` chain array-limit-bypass/DoS — moderate,
production dependency) remain **not yet confirmed fixed** — `npm audit
fix` was recommended in Phase 7; whether it has been run and re-verified
(typecheck + unit tests re-passing afterward) has not been reported back
in this session.

## 5. Backup/recovery status

- Backup: **not configured** — no provider chosen, nothing to configure.
- Restore: **not verified** — cannot be, without a backup file.
- Rollback: **documented, not exercised** (nothing deployed to roll back).
- Recovery procedure: **documented** in `deployment.md` §7 and
  `runbook.md`, explicitly marked untested throughout.

## 6. Event-day readiness

**Not operationally ready.** Independent of code quality, an event
cannot run on infrastructure that doesn't exist: no domain, no HTTPS, no
live payment/email credentials, no monitoring target, no backup that's
ever been restored. The checklist to work through once those exist is in
`runbook.md`.

## 7. Remaining issues

**Release blockers** (must resolve before "PRODUCTION READY" is honest):
1. No hosting platform chosen for backend, frontends, or database.
2. No domain/HTTPS.
3. No live/test payment provider connected end-to-end.
4. No SMTP credentials configured/tested end-to-end (per `deployment.md`,
   already known before this session).
5. No backup has ever been taken or restored.
6. Phase 7's 4 dependency-audit findings not confirmed remediated.
7. Full E2E/security/accessibility/performance verification from Phase 7's
   own outstanding list is still outstanding (Section 6 of that report).

**Non-blocking issues:**
- `npm audit` in CI is informational-only until the above findings are
  resolved (by design, this session).
- No log aggregation/external alerting configured (nowhere to send it yet).
- Favicon/logo assets are empty placeholders in all three apps.

**Intentionally deferred (per Phase 8's own spec — "keep infrastructure
simple," "do not invent enterprise-scale processes"):**
- No containers/orchestration/queues/Redis — correctly out of scope for
  this architecture.
- No CD pipeline until a host exists — building one against nothing would
  itself be fake functionality.

## 8. Final decision

**NOT PRODUCTION READY.**

The one concrete, host-agnostic defect Phase 8 surfaced (missing SPA
fallback/caching config, §1) has been found, fixed, and documented. Every
other blocker is the same root cause repeated: this platform has real,
carefully-built application code, but no chosen infrastructure to deploy
it to. That is a decision only you can make (which host, which domain,
which payment/email account) — once it's made, most of the BLOCKED rows
in the table above become runnable in a single next session, in the exact
order §41 of the spec lays out (starting from "run migrations against the
real database" through the smoke tests and post-deployment checks).
