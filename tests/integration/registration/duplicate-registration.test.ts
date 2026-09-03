import { describe, expect, it } from 'vitest';
import { getTestAgent, registerTestAttendee } from '../../fixtures/test-app.js';

/**
 * Edge case from the master spec: "user submits registration twice" /
 * "two browser tabs submit simultaneously". The DB carries a unique
 * constraint on registrations.attendee_id (migration 033) as the
 * race-safe backstop behind the app-level check in
 * registrations.service.ts — this exercises the whole path end to end.
 */
describe('Duplicate event registration', () => {
  it('rejects a second registration attempt by the same attendee with 409', async () => {
    const { response } = await registerTestAttendee('dup-reg');
    const token: string = response.body.data.accessToken;
    const agent = getTestAgent();

    const first = await agent
      .post('/api/v1/me/registration')
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(first.status).toBe(201);

    const second = await agent
      .post('/api/v1/me/registration')
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('DUPLICATE_RESOURCE');
  });

  it('rejects two near-simultaneous registration attempts, only one wins', async () => {
    const { response } = await registerTestAttendee('dup-reg-race');
    const token: string = response.body.data.accessToken;
    const agent = getTestAgent();

    const [first, second] = await Promise.all([
      agent.post('/api/v1/me/registration').set('Authorization', `Bearer ${token}`).send(),
      agent.post('/api/v1/me/registration').set('Authorization', `Bearer ${token}`).send(),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);
  });
});
