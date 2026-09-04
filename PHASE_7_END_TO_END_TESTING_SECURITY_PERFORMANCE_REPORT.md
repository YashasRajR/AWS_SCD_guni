# Phase 7 — End-to-End Testing, Security, Performance & Production Hardening

**Date:** 2026-09-04. Method: same constraint as Phase 6 — this environment cannot run `vite`/`vitest`/`tsup` (missing `@rollup/rollup-linux-x64-gnu` native binary) or reach a live dev server/browser, and `npm audit` timed out against the registry. What follows is what was actually run (lint, typecheck across every workspace) plus a direct read of the highest-risk security-critical code paths, not a claim that the full 47-section Phase 7 checklist was executed. See Section 6 for exactly what remains and the commands to run locally.

**Status: PARTIAL PASS — evidence-based, environment-limited.**
This report is deliberately scoped to what was actually verified. It does not
claim work that could not be executed or observed from this session.

---

## 0. A hard environment constraint that shapes this whole report

This session works on your repository through a shell running in an isolated
Linux VM (not your actual Windows machine, and not a CI runner). In that VM:

- `npx tsc --noEmit` and `eslint` run fine (pure Node/TypeScript, no native
  bindings).
- `vite`, `vitest`, `tsup` (build/test/dev for every frontend app **and**
  the backend) all fail immediately with
  `Cannot find module '@rollup/rollup-linux-x64-gnu'` — a missing optional
  native binary for this platform. This affects `npm run build`,
  `npm run test`, `npm run dev`, and `backend`'s `test:unit`/`test` scripts
  identically.
- `npm audit` timed out repeatedly (looks like restricted network egress to
  the npm registry's audit endpoint from this VM, not a code issue).

**Practical effect: I could not run any unit test, integration test, E2E
test, build, or dependency audit this session.** I did not attempt to work
around this by touching `node_modules`/`package-lock.json` (rebuilding
native deps risks corrupting your real project install, per this session's
standing rule). Everything below that says "PASS" is something I actually
ran and saw pass. Everything I could not run is listed explicitly in
Section 6, with the exact commands to run locally.

---

## 1. What I actually ran (Section 2/43 of the spec)

| Check | Scope | Result |
|---|---|---|
| `eslint . --max-warnings=0` | whole monorepo | **PASS** — zero errors, zero warnings |
| `tsc --noEmit` | `backend` | **PASS** |
| `tsc --noEmit` | `apps/web`, `apps/volunteer`, `apps/admin` | **PASS** (all three) |
| `tsc --noEmit` | all 8 `packages/*` with a tsconfig | **PASS** (all eight) |
| `vitest run` (unit, no DB) | `backend` | **Could not run** — rollup native binary missing |
| `npm audit` | root | **Could not run** — timed out (network) |
| Build, migrations, E2E, accessibility, performance | all | **Could not run/observe** — no working dev server or browser-reachable app from this environment |

No test failures are being hidden — the tests simply could not execute here.
This is the same limitation disclosed in the Phase 6 report; it hasn't
changed.

---

## 2. Repository reality check (Section 2)

The repo already has substantially more infrastructure than a "Phases 1–6
maybe aren't real" assumption would suggest:

- `.github/workflows/ci.yml` already runs lint → typecheck → build, a
  DB-free unit-test job, and a DB-backed integration-test job against a
  real Postgres service container. This is a reasonable foundation, though
  it's missing accessibility/E2E/dependency-audit gates (Section 6).
- `tests/` already has real integration and unit suites for auth, RBAC/role
  spoofing, CORS, payment webhook idempotency/signature, ticket ownership,
  registration duplication, certificate verification, checkpoint
  (attendance) reversal, and role-permission seeding — i.e. much of the
  Section 3 test matrix already has code behind it. I could not execute
  these to confirm they currently pass (Section 0), but their existence and
  naming line up with the real workflows, not stubs.
- No QR/NFC/barcode/scanner code exists anywhere in `backend`, `apps/*`, or
  `packages/*` (grepped for `qr`, `qrcode`, `nfc`, `barcode`, `near-field`).
  The one hit was a guardrail comment (`// DO NOT add QR/NFC fields here`)
  in `tickets.repository.ts`. A few empty leftover test directories
  (`tests/unit/qr`, `tests/integration/scanner`, `tests/unit/checkpoints`,
  `tests/integration/ticket`, `tests/unit/payment`) exist as dead scaffolding
  — harmless, but worth deleting (P3).
- `.env` (with a live Neon Postgres URL and other real secrets) is correctly
  gitignored and has never been committed (`git log --all -- .env` is
  empty). `.env.example` exists separately for placeholders.

## 3. Targeted security code audit (Sections 5, 6, 11, 12, 20)

Given I couldn't run the security test suite, I read the highest-risk code
paths directly instead of taking their correctness on faith:

- **Authentication** (`middleware/authentication/index.ts`): Bearer JWT
  verified server-side; account `status` is re-checked against the database
  on *every* request (not just at login), so a suspended user's still-valid
  access token stops working immediately rather than at its natural
  expiry. Good.
- **Authorization** (`middleware/authorization/index.ts`): role/permission
  checks are server-side (`requireRole`, `requirePermission`), plus a
  `requireOwnUserId` ownership guard for `/me`-style routes. No frontend
  route guard is being relied on as the real boundary.
- **Payment webhook** (`payments.service.ts`): signature verified over the
  raw body before anything else runs; delivery dedup is enforced by a
  database insert-first-wins pattern (not an application-level check);
  state transitions are idempotent no-ops once terminal; the amount ever
  charged comes from the server-side event record, never from client or
  webhook input. This matches the Section 12 threat model well.
- **Rate limiting**: every auth-sensitive route (register, login, refresh,
  logout, forgot/reset-password, verify-email, change-password) goes
  through a dedicated stricter limiter; a general limiter covers the rest
  of `/api/v1`.
- **CORS/headers** (`server/app.ts`): explicit origin allowlist (the three
  known app URLs, no wildcard), Helmet applied, `credentials: true` is
  correctly *not* set because auth is Bearer-token-only (no cookies in
  play), request body capped at 1MB, and the raw body needed for webhook
  signature verification is captured without weakening the JSON parser for
  everything else.

## 4. Defect found and fixed (Section 20/39 — idempotency/concurrency)

**P1 — ticket issuance had no protection against a real (if narrow) race,
unlike every comparable "issue exactly once" path in the same codebase.**

- `tickets.repository.ts`'s `issue()` was check-then-insert with no
  handling for the database's own `tickets_registration_id_unique`
  constraint. The equivalent code for certificates
  (`certificates.service.ts`) catches the `23505` unique-violation and
  re-fetches; achievements (`achievements.repository.ts`) uses
  `ON CONFLICT ... DO NOTHING`. Tickets was the one outlier.
- Concretely exploitable path: a Razorpay webhook retry and an admin's
  manual "confirm registration" click both call
  `registrations.service.updateStatus` -> `ticketsService.issueIfNeeded`.
  If both raced past the "no ticket yet" check, the loser hit an unhandled
  Postgres error. If the loser was the webhook path, worse still: the
  webhook's own delivery-dedup record had *already* been written before
  the failure, so a subsequent retry of the *same* webhook delivery would
  be silently treated as "already handled" — permanently skipping ticket
  issuance for that attendee with no error surfaced anywhere.
- **Fix**: `INSERT ... ON CONFLICT (registration_id) DO NOTHING`, then
  re-select on conflict — the same pattern already used for achievements.
  Committed as `0538e8b`. Verified with `tsc --noEmit`; could not exercise
  the actual race with a test (Section 0).

No other release blockers were found in the code paths reviewed. This was
**not** an exhaustive sweep of every resource's IDOR/BOLA surface, every
input-validation boundary, or every admin CRUD endpoint (Sections 7, 8, 16)
— that is a much larger effort than fit in this session; see Section 6.

## 5. UI theme work (unrelated to Phase 7, done earlier this session)

Not part of this phase, noted for completeness: the public site's palette
was reverted from an earlier Mood-Indigo-inspired dark redesign back to the
official poster's own colors (white/lavender background, flat solid
`#50377a` purple type, `#f28a45` orange accents, no drop-shadow effects),
per your direct feedback comparing it against the actual poster. Commits
`0cc5ec5`, `8733d54`, `7639402`. CSS-only, no functional changes.

## 6. What genuinely remains (do not read this as "fixed")

**Could not execute in this environment — run these on your machine before
trusting any pass/fail claim about them:**

```
npm run test:unit --workspace=backend   # DB-free unit tests
npm run test --workspace=backend        # needs Postgres (see .env / TEST_DATABASE_URL)
npm run build                           # all workspaces
npm run db:migrate:status               # then db:migrate up against a clean DB
npm audit
```

**Not attempted this session (genuinely out of scope for the time available,
not silently skipped):**

- Full IDOR/BOLA sweep across every resource in Section 7 (only
  auth/RBAC/payments were read in depth).
- Injection/XSS audit of user-controlled content fields (Section 9).
- Frontend E2E across all three apps and viewport sizes (Sections 26-28) —
  this environment's browser tools cannot reach a dev server started in
  this same VM, and the dev server itself can't start here anyway.
- Performance measurement (Section 29) — no way to load the app to measure it.
- CI gate additions for accessibility/E2E/dependency-audit (Section 37).
- Documentation refresh (Section 42).

## 7. Final readiness decision

**NOT RELEASE READY** — not because a blocker is known to exist, but because
the mandatory verification (Section 43: tests, build, migrations, E2E,
accessibility, dependency audit) has not actually been run against current
`main` by anyone, in or out of this session, since these Phase 7 changes
landed. The one concrete defect found was fixed and reasoned through, but a
release decision resting only on code review (however careful) instead of
green tests is not a real release gate. Once you run the commands in
Section 6 locally and they pass, this becomes a much shorter conversation
about the specific remaining items in Section 6 rather than a blanket
re-audit.
