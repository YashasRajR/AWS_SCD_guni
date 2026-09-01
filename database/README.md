# Database

PostgreSQL is the system of record. There is no ORM — schema changes are
plain, reviewable SQL, applied by a small custom migration runner.

## Layout

- `migrations/` — the canonical, ordered source of truth. Each migration is
  a pair of files, `NNN_name.up.sql` / `NNN_name.down.sql`, applied in
  filename order and tracked in a `schema_migrations` table.
- `schema/` — one reference file per table, auto-documented from the
  migration that created it. Read these to understand the current shape of
  a table; **edit `migrations/`, not `schema/`**, to change it.
- `seed/` — reserved for larger fixture data as the project grows; the
  actual dev seed script lives in `scripts/seed.mjs` (kept next to the
  migration runner since both need the same DB connection helper).
- `scripts/` — `db.mjs` (connection helper), `migrate.mjs` (runner),
  `seed.mjs` (dev seed data).
- `functions/`, `views/` — reserved for future stored functions/views; empty
  for now.

## Commands

Run from the repo root (they call the scripts in `database/scripts`
directly):

```bash
npm run db:migrate          # apply all pending migrations
npm run db:migrate:status   # show applied vs. pending migrations
npm run db:migrate:down     # roll back the most recent migration
npm run db:seed             # insert dev seed data (idempotent)
npm run db:reset            # drop the public schema, re-migrate, re-seed
```

All of them read `DATABASE_URL` from `.env` (see `.env.example`).

## Design notes

- Primary keys are UUIDs (`gen_random_uuid()`, via `pgcrypto`) for every
  public-facing entity.
- Every table has `created_at`; every mutable table has `updated_at`,
  auto-maintained by a shared `set_updated_at()` trigger.
- Status/type columns are `TEXT` with a `CHECK` constraint rather than a
  Postgres `ENUM`, so adding a new status only ever needs a migration that
  alters the constraint — no type-wide `ALTER TYPE` dance.
- Foreign keys are enforced everywhere; `ON DELETE CASCADE` is used for
  strictly-owned child rows (e.g. `attendees.user_id`), `ON DELETE SET
  NULL` where the parent is just a reference (e.g.
  `checkpoint_attendance.volunteer_id`).
- `checkpoints`, `speakers`, `sessions`, `agenda_items`, `timeline_items`,
  `venues`, `faqs`, `announcements` and `achievements` are pure data — the
  application never hard-codes their names or conditions. Admins manage
  them entirely through the backend API.
- `checkpoint_attendance` has a partial unique index
  (`WHERE status = 'COMPLETED'`) that stops the same attendee completing
  the same checkpoint twice, while still allowing an explicit admin
  reversal (`status = 'REVERSED'`) followed by a fresh completion.
- No QR/NFC columns, tables, or references exist anywhere in this schema.

## Entity overview

```
users ──┬── attendees ──┬── registrations ── payments
        │               │                └── tickets
        │               ├── checkpoint_attendance ── checkpoints (per event)
        │               ├── certificates
        │               ├── attendee_achievements ── achievements
        │               ├── event_wrapped
        │               └── social_shares
        ├── volunteers ── volunteer_checkpoint_assignments ── checkpoints
        └── user_roles ── roles ── role_permissions ── permissions

events ──┬── venues
         ├── agenda_items ── sessions ── session_speakers ── speakers
         ├── timeline_items
         └── checkpoints
```
