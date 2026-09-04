import { describe, expect, it, beforeAll } from 'vitest';
import { getTestAgent, loginAs, registerTestAttendee } from '../../fixtures/test-app.js';

describe('GET /admin/attendees search', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await loginAs('admin@dev.local', 'DevPassw0rd!');
    adminToken = res.body.data.accessToken;
  });

  it('rejects an unauthenticated request', async () => {
    const res = await getTestAgent().get('/api/v1/admin/attendees');
    expect(res.status).toBe(401);
  });

  it('finds a specific attendee by a name fragment, ignoring others', async () => {
    await registerTestAttendee('search-needle-Zephyr');

    const res = await getTestAgent()
      .get('/api/v1/admin/attendees')
      .query({ page: 1, pageSize: 10, search: 'Zephyr' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    for (const item of res.body.data.items) {
      expect(item.fullName).toContain('Zephyr');
    }
  });

  it('returns an empty page for a search term matching nobody', async () => {
    const res = await getTestAgent()
      .get('/api/v1/admin/attendees')
      .query({ page: 1, pageSize: 10, search: 'no-such-attendee-xyz-000' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.pagination.totalItems).toBe(0);
  });
});
