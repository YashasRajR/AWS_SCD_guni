import { describe, expect, it } from 'vitest';
import { getTestAgent, getTestPool, registerTestAttendee } from '../../fixtures/test-app.js';

/**
 * Phase 4: `authenticate` must re-check the account's current status on
 * every request, not just trust the JWT payload — an admin
 * suspending/deactivating a user must take effect immediately, not only
 * once that user's already-issued access token happens to expire. There
 * is no admin suspend/deactivate endpoint yet, so this flips the status
 * directly in the database (the same pattern other integration tests use
 * for state this phase's API surface doesn't expose a mutation for).
 */
describe('account status enforcement on already-issued access tokens', () => {
  it('rejects a still-unexpired access token once the account is SUSPENDED', async () => {
    const { response } = await registerTestAttendee('status-suspend');
    const accessToken: string = response.body.data.accessToken;
    const userId: string = response.body.data.user.id;

    const before = await getTestAgent()
      .get('/api/v1/me/profile')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(before.status).toBe(200);

    await getTestPool().query("UPDATE users SET status = 'SUSPENDED' WHERE id = $1", [userId]);

    const after = await getTestAgent()
      .get('/api/v1/me/profile')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(after.status).toBe(401);
  });

  it('rejects a still-unexpired access token once the account is DEACTIVATED', async () => {
    const { response } = await registerTestAttendee('status-deactivate');
    const accessToken: string = response.body.data.accessToken;
    const userId: string = response.body.data.user.id;

    await getTestPool().query("UPDATE users SET status = 'DEACTIVATED' WHERE id = $1", [userId]);

    const res = await getTestAgent()
      .get('/api/v1/me/profile')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(401);
  });

  it('rejects a token for a user id that no longer exists', async () => {
    const { response } = await registerTestAttendee('status-deleted');
    const accessToken: string = response.body.data.accessToken;
    const userId: string = response.body.data.user.id;

    // No user-deletion endpoint exists; simulate via direct removal —
    // FK cascades (attendees/user_roles/refresh_tokens) handle cleanup.
    await getTestPool().query('DELETE FROM users WHERE id = $1', [userId]);

    const res = await getTestAgent()
      .get('/api/v1/me/profile')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(401);
  });
});
