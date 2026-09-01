import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['../tests/**/*.test.ts'],
    globalSetup: ['../tests/fixtures/global-setup.ts'],
    setupFiles: ['../tests/fixtures/setup-env.ts'],
    testTimeout: 15000,
    hookTimeout: 20000,
    // Run test files serially — they share one Postgres test database and
    // several tests depend on row-level uniqueness (duplicate email,
    // duplicate checkpoint completion), which a parallel run would race.
    fileParallelism: false,
  },
});
