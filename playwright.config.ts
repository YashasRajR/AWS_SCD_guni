import { defineConfig, devices } from '@playwright/test';

// Minimal E2E smoke suite: one project per frontend app, each with its own
// dev server + baseURL. All three talk to the same backend (localhost:4000),
// started separately (see package.json's "test:e2e" script and CI job) --
// not declared as a webServer here because Playwright's webServer array
// doesn't guarantee start order, and the backend must be up (and migrated +
// seeded) before any frontend page can log in.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'line',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'web',
      testMatch: 'web.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' },
      webServer: {
        command: 'npm run dev -w apps/web',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
      },
    },
    {
      name: 'admin',
      testMatch: 'admin.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5175' },
      webServer: {
        command: 'npm run dev -w apps/admin',
        url: 'http://localhost:5175',
        reuseExistingServer: !process.env.CI,
      },
    },
  ],
});
