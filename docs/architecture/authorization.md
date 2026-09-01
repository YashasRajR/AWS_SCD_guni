# Authorization

Three layers, all enforced server-side (`backend/src/middleware/authorization`):

- **`requireRole(...roles)`** — the caller must hold at least one of the
  listed roles (`ADMIN` / `VOLUNTEER` / `ATTENDEE`). Used for the coarse
  split, e.g. `/api/v1/volunteer/*` requires `VOLUNTEER`.
- **`requirePermission(...codes)`** — the caller must hold every listed
  permission (see `packages/constants/src/permissions.ts` for the full
  list and the default role → permission seed). Used for the fine-grained
  admin checks, e.g. `/api/v1/admin/checkpoints` requires
  `MANAGE_CHECKPOINTS`.
- **Ownership** — `/api/v1/me/*` never accepts a client-supplied id; every
  handler resolves the caller's own attendee row from
  `req.identity.userId` (set by `authenticate`). There is no
  `/attendees/:id` route an attendee can point at someone else's data.

A volunteer does not automatically get admin permissions, and vice versa —
`ROLE_PERMISSION_SEED` in `packages/constants` is the single source of
truth for what each role can do, applied by `database/scripts/seed.mjs`.
Admins can change these grants at the database level without a code
change.

## Admin content management

Every public read-only content route (`/event`, `/speakers`, `/sessions`,
`/agenda`, `/timeline`, `/venues`, `/faqs`, `/announcements`) has an
`/admin/content/*` sibling with full create/update/delete, gated by that
domain's `MANAGE_*` permission (e.g. `MANAGE_SPEAKERS` for
`/admin/content/speakers`). The public routes only ever return `PUBLISHED`
rows; the admin routes see and manage every status (`DRAFT`, `PUBLISHED`,
`ARCHIVED`), so an admin can stage content before it goes live. Checkpoints
(`/admin/checkpoints`), volunteers (`/admin/volunteers`, including
checkpoint assignment), and registrations (`/admin/registrations/:id/status`)
have the equivalent write endpoints directly on their existing admin
routers rather than a separate `/content` path, since they were already
admin-only.

Promoting a user to VOLUNTEER (`POST /admin/volunteers`) takes an email,
not a raw user id — the target account must already exist (registered via
`/auth/register`); the endpoint grants the VOLUNTEER role and creates the
volunteer profile row. Because roles are embedded in the JWT at issuance
(see `authentication.md`), the promoted user only gets volunteer access
after their next login.

## Volunteer checkpoint completion — the full check

`checkpointsService.completeCheckpoint` (the highest-stakes write in this
phase) checks, in order: the checkpoint exists and is `PUBLISHED`, the
calling volunteer has an `ACTIVE` row in
`volunteer_checkpoint_assignments` for that checkpoint, the attendee
exists, and the attendee has no existing `COMPLETED` attendance row for
that checkpoint. The last check is backed by a partial unique index
(`checkpoint_attendance_unique_completed`), so a race between two
volunteers scanning the same attendee at once still can't produce two
completions — the losing request gets `CHECKPOINT_ALREADY_COMPLETED`
either from the app-level check or from catching the index's unique-
violation, whichever loses the race.
