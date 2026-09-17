import { describe, expect, it } from 'vitest';
import { getTestAgent, loginAs, registerTestAttendee } from '../../fixtures/test-app.js';

async function tokenFor(email: string, password: string): Promise<string> {
  const res = await loginAs(email, password);
  return res.body.data.accessToken as string;
}

describe('Role- and permission-based authorization', () => {
  it('rejects an unauthenticated request to an admin route', async () => {
    const res = await getTestAgent().get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('rejects an unauthenticated request to /me', async () => {
    const res = await getTestAgent().get('/api/v1/me/profile');
    expect(res.status).toBe(401);
  });

  it('rejects an ATTENDEE calling an admin-only route', async () => {
    const { email } = await registerTestAttendee('authz-attendee');
    const token = await tokenFor(email, 'TestPassw0rd!');
    const res = await getTestAgent()
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows an ADMIN through, with the expected dashboard shape', async () => {
    const token = await tokenFor('admin@dev.local', 'DevPassw0rd!');
    const res = await getTestAgent()
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalRegistrations');
  });

  it('rejects a request with a garbage bearer token', async () => {
    const res = await getTestAgent()
      .get('/api/v1/me/profile')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('Attendee resource ownership', () => {
  it('scopes /me/profile to the authenticated attendee only', async () => {
    const a = await registerTestAttendee('owner-a');
    const b = await registerTestAttendee('owner-b');
    const tokenA = a.response.body.data.accessToken as string;
    const tokenB = b.response.body.data.accessToken as string;

    const profileA = await getTestAgent()
      .get('/api/v1/me/profile')
      .set('Authorization', `Bearer ${tokenA}`);
    const profileB = await getTestAgent()
      .get('/api/v1/me/profile')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(profileA.body.data.fullName).toBe('Test Attendee owner-a');
    expect(profileB.body.data.fullName).toBe('Test Attendee owner-b');
    expect(profileA.body.data.id).not.toBe(profileB.body.data.id);
  });
});
