import { defineConfig } from 'vitest/config';

/**
 * Runs only the DB-free unit tests (pure functions and domain services with
 * their repositories mocked out via vi.mock) — no globalSetup, no Postgres
 * required. Use this for a fast local/CI check; `npm test` (vitest.config.ts)
 * additionally runs the integration/API tests against a real Postgres test
 * database.
 */
export default defineConfig({
  test: {
    include: ['../tests/unit/**/*.test.ts'],
    setupFiles: ['../tests/fixtures/setup-unit-env.ts'],
    testTimeout: 15000,
  },
});
