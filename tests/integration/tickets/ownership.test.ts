import { describe, expect, it } from 'vitest';
import { getTestAgent, loginAs, registerAndCreatePendingRegistration } from '../../fixtures/test-app.js';

async function adminToken(): Promise<string> {
  const res = await loginAs('admin@dev.local', 'DevPassw0rd!');
  return res.body.data.accessToken as string;
}

/**
 * There is no id-scoped "get ticket by id" endpoint for attendees — every
 * /me/* route resolves data from req.identity, never a client-supplied id
 * (see user-dashboard.controller.ts) — so the ownership guarantee here is
 * that two different attendees' tokens only ever surface their own ticket,
 * never each other's, and that a non-attendee role can't hit the route at
 * all.
 */
describe('Ticket ownership (/me/ticket)', () => {
  it('returns null (not an error) before the registration is confirmed', async () => {
    const { token } = await registerAndCreatePendingRegistration('ticket-pending');
    const res = await getTestAgent().get('/api/v1/me/ticket').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it('two different attendees each see only their own ticket after confirmation', async () => {
    const admin = await adminToken();
    const a = await registerAndCreatePendingRegistration('ticket-owner-a');
    const b = await registerAndCreatePendingRegistration('ticket-owner-b');

    await getTestAgent()
      .patch(`/api/v1/admin/registrations/${a.registrationId}/status`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'CONFIRMED' });
    await getTestAgent()
      .patch(`/api/v1/admin/registrations/${b.registrationId}/status`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'CONFIRMED' });

    const ticketA = await getTestAgent().get('/api/v1/me/ticket').set('Authorization', `Bearer ${a.token}`);
    const ticketB = await getTestAgent().get('/api/v1/me/ticket').set('Authorization', `Bearer ${b.token}`);

    expect(ticketA.status).toBe(200);
    expect(ticketB.status).toBe(200);
    expect(ticketA.body.data.ticketNumber).toBeTruthy();
    expect(ticketB.body.data.ticketNumber).toBeTruthy();
    expect(ticketA.body.data.ticketNumber).not.toBe(ticketB.body.data.ticketNumber);
  });

  it('rejects an unauthenticated request', async () => {
    const res = await getTestAgent().get('/api/v1/me/ticket');
    expect(res.status).toBe(401);
  });

  it('rejects a non-attendee account (route is attendee-only)', async () => {
    const admin = await adminToken();
    const res = await getTestAgent().get('/api/v1/me/ticket').set('Authorization', `Bearer ${admin}`);
    expect(res.status).toBe(403);
  });
});
