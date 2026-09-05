import { test, expect } from '@playwright/test';
import { login, DEV_PASSWORD, SEEDED_USERS } from './support/login.js';

test('attendee can log in and reach their dashboard', async ({ page }) => {
  await login(page, SEEDED_USERS.attendee, DEV_PASSWORD, /log in/i);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'My dashboard' })).toBeVisible();
});

test('rejects a wrong password', async ({ page }) => {
  await login(page, SEEDED_USERS.attendee, 'wrong-password', /log in/i);
  await expect(page.getByText(/failed to log in|invalid/i)).toBeVisible();
});
