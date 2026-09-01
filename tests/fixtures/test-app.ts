import request from 'supertest';
import { createApp } from '../../backend/src/server/app.js';
import { getPool } from '../../backend/src/config/database.js';

/** A fresh Express app instance, wired to the test database. */
export function getTestAgent() {
  return request(createApp());
}

export function getTestPool() {
  return getPool();
}

let counter = 0;
/** A unique, obviously-fake email for a single test's account creation. */
export function uniqueTestEmail(label: string): string {
  counter += 1;
  return `test-${label}-${Date.now()}-${counter}@example.test`;
}

export const VALID_TEST_PASSWORD = 'TestPassw0rd!';

export async function registerTestAttendee(label: string) {
  const email = uniqueTestEmail(label);
  const agent = getTestAgent();
  const res = await agent.post('/api/v1/auth/register').send({
    email,
    password: VALID_TEST_PASSWORD,
    fullName: `Test Attendee ${label}`,
    consent: true,
  });
  return { email, response: res };
}

export async function loginAs(email: string, password: string) {
  return getTestAgent().post('/api/v1/auth/login').send({ email, password });
}
