// Non-hard-coded-into-logic reference data used ONLY by the database seed
// script to create initial rows. The application never branches on these
// names directly — roles etc. are always looked up from the
// database so admins can add more later without a code change.

export const DEFAULT_EVENT = {
  name: 'AWS Student Community Day 2026',
  slug: 'aws-student-community-day-2026',
} as const;

