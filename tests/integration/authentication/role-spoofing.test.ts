import { describe, expect, it } from 'vitest';
import { getTestAgent, loginAs, uniqueTestEmail, VALID_TEST_PASSWORD } from '../../fixtures/test-app.js';

describe('role spoofing via request body is ignored', () => {
  it('registering with forged role/permission fields grants only ATTENDEE', async () => {
    const email = uniqueTestEmail('role-spoof');
    const res = await getTestAgent().post('/api/v1/auth/register').send({
      email,
      password: VALID_TEST_PASSWORD,
      fullName: 'Role Spoof Attempt',
      registrationType: 'STUDENT',
      phone: '+919876543210',
      dateOfBirth: '2000-01-01',
      university: 'Test University',
      department: 'Computer Science',
      branch: 'CSE',
      year: '2026',
      consent: true,
      // Forged fields per Phase 4 spec's example — none of these are
      // fields registerSchema declares, so zod strips them silently.
      role: 'SUPER_ADMIN',
      roles: ['SUPER_ADMIN'],
      permissions: ['MANAGE_ROLES'],
      isAdmin: true,
      accountStatus: 'ACTIVE',
      isVerified: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.emailVerifiedAt).toBeNull(); // isVerified: true had no effect

    const loginRes = await loginAs(email, VALID_TEST_PASSWORD);
    // A pure ATTENDEE has no PERMISSIONS grants (packages/constants/src/permissions.ts).
    expect(loginRes.body.data.accessToken).toBeTruthy();
    const [, payloadB64] = loginRes.body.data.accessToken.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
    expect(payload.roles).toEqual(['ATTENDEE']);
    expect(payload.permissions).toEqual([]);
  });

  it("changing a user's own role through /admin/users is blocked without MANAGE_ROLES, even for ADMIN", async () => {
    const adminLogin = await loginAs('admin@dev.local', 'DevPassw0rd!');
    const adminToken = adminLogin.body.data.accessToken;
    const adminUserId = adminLogin.body.data.user.id;

    const res = await getTestAgent()
      .post(`/api/v1/admin/users/${adminUserId}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'SUPER_ADMIN' });

    expect(res.status).toBe(403);
  });
});
