// Single source of truth for the test database URL, shared by the
// vitest globalSetup (migrate + seed) and each test worker (setupFiles).
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/scd_test';
