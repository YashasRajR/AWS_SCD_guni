import { describe, it, expect } from 'vitest';
import { getTestAgent, loginAs, registerTestAttendee } from '../../fixtures/test-app.js';

/**
 * SUPER_ADMIN-exclusive role management: /api/v1/admin/users. Covers the
 * new SUPER_ADMIN authorization boundary (ADMIN must be rejected), and
 * the concurrency-relevant "cannot revoke the last SUPER_ADMIN" guard.
 */
describe('admin role management (SUPER_ADMIN boundary)', () => {
  async function superAdminToken(): Promise<string> {
    const res = await loginAs('superadmin@dev.local', 'DevPassw0rd!');
    return res.body.data.accessToken as string;
  }

  async function adminToken(): Promise<string> {
    const res = await loginAs('admin@dev.local', 'DevPassw0rd!');
    return res.body.data.accessToken as string;
  }

  it('rejects an unauthenticated request', async () => {
    const res = await getTestAgent().get('/api/v1/admin/users');
    expect(res.status).toBe(401);
  });

  it('rejects ADMIN — MANAGE_ROLES is SUPER_ADMIN-only', async () => {
    const token = await adminToken();
    const listRes = await getTestAgent()
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(403);
  });

  it('allows SUPER_ADMIN to list users', async () => {
    const token = await superAdminToken();
    const res = await getTestAgent()
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    const superAdminRow = res.body.data.items.find(
      (u: { email: string }) => u.email === 'superadmin@dev.local',
    );
    expect(superAdminRow.roles).toContain('SUPER_ADMIN');
  });

  it('SUPER_ADMIN can grant and revoke a role on another user; ADMIN cannot', async () => {
    const superToken = await superAdminToken();
    const adminTok = await adminToken();
    const { email } = await registerTestAttendee('role-mgmt');

    const listRes = await getTestAgent()
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${superToken}`)
      .query({ search: email, pageSize: 5 });
    const targetUser = listRes.body.data.items.find((u: { email: string }) => u.email === email);
    expect(targetUser).toBeTruthy();

    // ADMIN is forbidden from granting roles at all.
    const forbiddenGrant = await getTestAgent()
      .post(`/api/v1/admin/users/${targetUser.id}/roles`)
      .set('Authorization', `Bearer ${adminTok}`)
      .send({ role: 'VOLUNTEER' });
    expect(forbiddenGrant.status).toBe(403);

    const grantRes = await getTestAgent()
      .post(`/api/v1/admin/users/${targetUser.id}/roles`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ role: 'VOLUNTEER' });
    expect(grantRes.status).toBe(200);
    expect(grantRes.body.data.roles).toContain('VOLUNTEER');

    // Granting the same role again is idempotent (unique PK, ON CONFLICT DO NOTHING).
    const grantAgain = await getTestAgent()
      .post(`/api/v1/admin/users/${targetUser.id}/roles`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ role: 'VOLUNTEER' });
    expect(grantAgain.status).toBe(200);

    const revokeRes = await getTestAgent()
      .delete(`/api/v1/admin/users/${targetUser.id}/roles/VOLUNTEER`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.roles).not.toContain('VOLUNTEER');
  });

  it("refuses to revoke the platform's last SUPER_ADMIN", async () => {
    const superToken = await superAdminToken();
    const listRes = await getTestAgent()
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${superToken}`)
      .query({ search: 'superadmin@dev.local' });
    const self = listRes.body.data.items.find(
      (u: { email: string }) => u.email === 'superadmin@dev.local',
    );

    const res = await getTestAgent()
      .delete(`/api/v1/admin/users/${self.id}/roles/SUPER_ADMIN`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(422);
  });
});
