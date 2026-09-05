import { test, expect } from '@playwright/test';
import { login, DEV_PASSWORD, SEEDED_USERS } from './support/login.js';

test('admin can log in and see the dashboard with trend charts', async ({ page }) => {
  await login(page, SEEDED_USERS.admin, DEV_PASSWORD, /sign in/i);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.locator('.chart-section').first()).toBeVisible();
});

test('admin can export registrations as CSV', async ({ page }) => {
  await login(page, SEEDED_USERS.admin, DEV_PASSWORD, /sign in/i);
  await page.goto('/registrations');
  await expect(page.getByRole('heading', { name: 'Registrations' })).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('registrations.csv');
});
