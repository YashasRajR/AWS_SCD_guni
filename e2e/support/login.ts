import type { Page } from '@playwright/test';

/** Fills and submits the shared email/password login form used by all three apps. */
export async function login(page: Page, email: string, password: string, submitName: RegExp) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: submitName }).click();
}

// Seeded by database/scripts/seed.mjs -- same fake dev-only accounts the
// backend's integration test fixtures use.
export const DEV_PASSWORD = 'DevPassw0rd!';
export const SEEDED_USERS = {
  superAdmin: 'superadmin@dev.local',
  admin: 'admin@dev.local',
  attendee: 'attendee1@dev.local',
} as const;
