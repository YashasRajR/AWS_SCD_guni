import { describe, expect, it, beforeAll } from 'vitest';
import { getTestAgent, loginAs, registerTestAttendee } from '../../fixtures/test-app.js';

/**
 * Admin correction/reversal of a manually-recorded checkpoint attendance.
 * Uses a freshly registered attendee (not a seeded dev one) so this file
 * doesn't interact with checkpoint-completion state other test files rely on.
 */
describe('Admin checkpoint-attendance reversal', () => {
  let volunteerToken: string;
  let adminToken: string;
  let attendeeId: string;
  let checkpointId: string;

  beforeAll(async () => {
    const volunteerRes = await loginAs('volunteer@dev.local', 'DevPassw0rd!');
    volunteerToken = volunteerRes.body.data.accessToken;
    const adminRes = await loginAs('admin@dev.local', 'DevPassw0rd!');
    adminToken = adminRes.body.data.accessToken;

    const { email } = await registerTestAttendee('reversal-flow');
    const listRes = await getTestAgent()
      .get('/api/v1/volunteer/attendees/search')
      .query({ q: 'Test Attendee reversal-flow' })
      .set('Authorization', `Bearer ${volunteerToken}`);
    attendeeId = listRes.body.data[0].id;
    expect(attendeeId, `attendee for ${email} should be findable`).toBeTruthy();

    const checkpointsRes = await getTestAgent()
      .get('/api/v1/admin/checkpoints')
      .query({ page: 1, pageSize: 50 })
      .set('Authorization', `Bearer ${adminToken}`);
    checkpointId = checkpointsRes.body.data.items.find(
      (c: { name: string }) => c.name === 'Registration',
    ).id;
  });

  it('reverses a completed attendance and allows re-recording it', async () => {
    const completeRes = await getTestAgent()
      .post('/api/v1/volunteer/checkpoints/complete')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ checkpointId, attendeeId });
    expect(completeRes.status).toBe(201);
    const attendanceId = completeRes.body.data.id;

    // A volunteer (COMPLETE_CHECKPOINT only, not MANAGE_CHECKPOINTS) cannot reverse.
    const forbidden = await getTestAgent()
      .post(`/api/v1/admin/checkpoints/attendance/${attendanceId}/reverse`)
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ reason: 'wrong attendee' });
    expect(forbidden.status).toBe(403);

    const reverseRes = await getTestAgent()
      .post(`/api/v1/admin/checkpoints/attendance/${attendanceId}/reverse`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'wrong attendee confirmed by mistake' });
    expect(reverseRes.status).toBe(200);
    expect(reverseRes.body.data.status).toBe('REVERSED');

    // Reversing again is rejected — it's no longer COMPLETED.
    const secondReverse = await getTestAgent()
      .post(`/api/v1/admin/checkpoints/attendance/${attendanceId}/reverse`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(secondReverse.status).toBe(422);

    // The reversal freed the (attendee, checkpoint) pair up for a fresh completion.
    const recompleteRes = await getTestAgent()
      .post('/api/v1/volunteer/checkpoints/complete')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ checkpointId, attendeeId });
    expect(recompleteRes.status).toBe(201);
    expect(recompleteRes.body.data.id).not.toBe(attendanceId);
  });

  it('404s reversing a nonexistent attendance record', async () => {
    const res = await getTestAgent()
      .post('/api/v1/admin/checkpoints/attendance/00000000-0000-0000-0000-000000000000/reverse')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(404);
  });
});
