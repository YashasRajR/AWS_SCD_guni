import { describe, it, expect } from 'vitest';
import { getTestAgent, getTestPool, loginAs, registerTestAttendee, uniqueTestEmail } from '../../fixtures/test-app.js';

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
      .send({ role: 'FINANCE_ADMIN' });
    expect(forbiddenGrant.status).toBe(403);

    const grantRes = await getTestAgent()
      .post(`/api/v1/admin/users/${targetUser.id}/roles`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ role: 'FINANCE_ADMIN' });
    expect(grantRes.status).toBe(200);
    expect(grantRes.body.data.roles).toContain('FINANCE_ADMIN');

    // Granting the same role again is idempotent (unique PK, ON CONFLICT DO NOTHING).
    const grantAgain = await getTestAgent()
      .post(`/api/v1/admin/users/${targetUser.id}/roles`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ role: 'FINANCE_ADMIN' });
    expect(grantAgain.status).toBe(200);

    const revokeRes = await getTestAgent()
      .delete(`/api/v1/admin/users/${targetUser.id}/roles/FINANCE_ADMIN`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.roles).not.toContain('FINANCE_ADMIN');
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

/**
 * "Add admin" (POST /admin/users/invite): find-or-create by email, then
 * grant the requested role. Same SUPER_ADMIN/MANAGE_ROLES boundary as the
 * rest of this router.
 */
describe('admin invite (POST /admin/users/invite)', () => {
  async function superAdminToken(): Promise<string> {
    const res = await loginAs('superadmin@dev.local', 'DevPassw0rd!');
    return res.body.data.accessToken as string;
  }

  async function adminToken(): Promise<string> {
    const res = await loginAs('admin@dev.local', 'DevPassw0rd!');
    return res.body.data.accessToken as string;
  }

  it('rejects an unauthenticated request', async () => {
    const res = await getTestAgent()
      .post('/api/v1/admin/users/invite')
      .send({ email: uniqueTestEmail('invite-unauth'), role: 'ADMIN' });
    expect(res.status).toBe(401);
  });

  it('rejects ADMIN — MANAGE_ROLES is SUPER_ADMIN-only', async () => {
    const token = await adminToken();
    const res = await getTestAgent()
      .post('/api/v1/admin/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: uniqueTestEmail('invite-forbidden'), role: 'ADMIN' });
    expect(res.status).toBe(403);
  });

  it('creates a new account for an unknown email, grants the role, and queues a set-password email', async () => {
    const superToken = await superAdminToken();
    const email = uniqueTestEmail('invite-new');

    const res = await getTestAgent()
      .post('/api/v1/admin/users/invite')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ email, role: 'CONTENT_ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.data.created).toBe(true);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.roles).toContain('CONTENT_ADMIN');

    const emailRow = await getTestPool().query(
      `SELECT template FROM email_records WHERE recipient = $1 AND template = 'admin-invite'`,
      [email],
    );
    expect(emailRow.rows.length).toBe(1);
  });

  it('grants the role in place for an email that already has an account, without creating a duplicate', async () => {
    const superToken = await superAdminToken();
    const { email } = await registerTestAttendee('invite-existing');

    const res = await getTestAgent()
      .post('/api/v1/admin/users/invite')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ email, role: 'FINANCE_ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.data.created).toBe(false);
    expect(res.body.data.user.roles).toContain('FINANCE_ADMIN');
    // Registration already granted ATTENDEE -- invite adds to it, doesn't replace it.
    expect(res.body.data.user.roles).toContain('ATTENDEE');

    const dupeCheck = await getTestPool().query(`SELECT count(*)::int AS count FROM users WHERE email = $1`, [
      email,
    ]);
    expect(dupeCheck.rows[0].count).toBe(1);
  });
});
