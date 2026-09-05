import { test, expect } from '@playwright/test';
import { login, DEV_PASSWORD, SEEDED_USERS } from './support/login.js';

test('volunteer can log in and see their assigned checkpoints', async ({ page }) => {
  await login(page, SEEDED_USERS.volunteer, DEV_PASSWORD, /log in/i);
  await expect(page.getByRole('heading', { name: 'Your checkpoints' })).toBeVisible();
});
