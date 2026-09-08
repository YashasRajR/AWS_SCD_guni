import { describe, expect, it } from 'vitest';
import {
  getTestAgent,
  loginAs,
  registerTestAttendee,
  uniqueTestEmail,
  VALID_TEST_PASSWORD,
} from '../../fixtures/test-app.js';

describe('POST /api/v1/auth/register', () => {
  it('creates an account and returns an access token, never the password hash', async () => {
    const { response } = await registerTestAttendee('register-basic');
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeTruthy();
    expect(response.body.data.user.email).toBeTruthy();
    // The response must never contain the password or its hash.
    expect(JSON.stringify(response.body)).not.toMatch(/password/i);
  });

  it('rejects a duplicate email', async () => {
    const email = uniqueTestEmail('dup');
    const agent = getTestAgent();
    const payload = {
      email,
      password: VALID_TEST_PASSWORD,
      fullName: 'Duplicate Test',
      registrationType: 'STUDENT',
      phone: '+919876543210',
      dateOfBirth: '2000-01-01',
      university: 'Test University',
      department: 'Computer Science',
      branch: 'CSE',
      year: '2026',
      consent: true,
    };
    const first = await agent.post('/api/v1/auth/register').send(payload);
    expect(first.status).toBe(201);

    const second = await agent.post('/api/v1/auth/register').send(payload);
    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
    expect(second.body.error.code).toBe('DUPLICATE_RESOURCE');
  });

  it('rejects invalid input (missing consent, weak password)', async () => {
    const res = await getTestAgent().post('/api/v1/auth/register').send({
      email: uniqueTestEmail('invalid'),
      password: 'short',
      fullName: 'X',
      consent: false,
    });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const { email } = await registerTestAttendee('login-ok');
    const res = await loginAs(email, VALID_TEST_PASSWORD);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('rejects an incorrect password without revealing which field was wrong', async () => {
    const { email } = await registerTestAttendee('login-bad-pw');
    const res = await loginAs(email, 'WrongPassword1');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects a login for an email that does not exist', async () => {
    const res = await loginAs(uniqueTestEmail('nope'), VALID_TEST_PASSWORD);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('logs in as the seeded dev admin account', async () => {
    const res = await loginAs('admin@dev.local', 'DevPassw0rd!');
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('admin@dev.local');
  });
});
