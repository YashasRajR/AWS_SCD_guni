import { describe, expect, it, beforeAll } from 'vitest';
import { getTestAgent, loginAs } from '../../fixtures/test-app.js';

let volunteerToken: string;
let adminToken: string;

beforeAll(async () => {
  const volunteerRes = await loginAs('volunteer@dev.local', 'DevPassw0rd!');
  volunteerToken = volunteerRes.body.data.accessToken;
  const adminRes = await loginAs('admin@dev.local', 'DevPassw0rd!');
  adminToken = adminRes.body.data.accessToken;
});

async function findAttendeeId(fullName: string): Promise<string> {
  const res = await getTestAgent()
    .get('/api/v1/volunteer/attendees/search')
    .query({ q: fullName })
    .set('Authorization', `Bearer ${volunteerToken}`);
  const match = res.body.data.find((a: { fullName: string }) => a.fullName === fullName);
  if (!match) throw new Error(`Seeded attendee "${fullName}" not found in search results`);
  return match.id;
}

async function findCheckpointId(name: string): Promise<string> {
  const res = await getTestAgent()
    .get('/api/v1/admin/checkpoints')
    .query({ page: 1, pageSize: 50 })
    .set('Authorization', `Bearer ${adminToken}`);
  const match = res.body.data.items.find((c: { name: string }) => c.name === name);
  if (!match) throw new Error(`Seeded checkpoint "${name}" not found`);
  return match.id;
}

describe('Volunteer checkpoint flow', () => {
  it("lists only the volunteer's assigned checkpoints", async () => {
    const res = await getTestAgent()
      .get('/api/v1/volunteer/checkpoints')
      .set('Authorization', `Bearer ${volunteerToken}`);
    expect(res.status).toBe(200);
    const names = res.body.data.map((c: { name: string }) => c.name);
    expect(names).toContain('Registration');
    expect(names).not.toContain('Breakfast'); // seeded volunteer is only assigned to Registration
  });

  it('completes an assigned checkpoint for a found attendee', async () => {
    const attendeeId = await findAttendeeId('Dev Attendee One');
    const checkpointId = await findCheckpointId('Registration');

    const res = await getTestAgent()
      .post('/api/v1/volunteer/checkpoints/complete')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ checkpointId, attendeeId });

    expect(res.status).toBe(201);
    expect(res.body.data.attendeeId).toBe(attendeeId);
    expect(res.body.data.checkpointId).toBe(checkpointId);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('rejects completing the same checkpoint twice for the same attendee', async () => {
    const attendeeId = await findAttendeeId('Dev Attendee One');
    const checkpointId = await findCheckpointId('Registration');

    const res = await getTestAgent()
      .post('/api/v1/volunteer/checkpoints/complete')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ checkpointId, attendeeId });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CHECKPOINT_ALREADY_COMPLETED');
  });

  it('rejects completing a checkpoint the volunteer is not assigned to', async () => {
    const attendeeId = await findAttendeeId('Dev Attendee Two');
    const checkpointId = await findCheckpointId('Breakfast');

    const res = await getTestAgent()
      .post('/api/v1/volunteer/checkpoints/complete')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ checkpointId, attendeeId });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CHECKPOINT_NOT_ASSIGNED');
  });

  it('reflects the completion in the attendee-scoped progress read', async () => {
    const attendeeLogin = await loginAs('attendee1@dev.local', 'DevPassw0rd!');
    const attendeeToken = attendeeLogin.body.data.accessToken;

    const res = await getTestAgent()
      .get('/api/v1/me/progress')
      .set('Authorization', `Bearer ${attendeeToken}`);

    expect(res.status).toBe(200);
    const registrationCheckpoint = res.body.data.find(
      (item: { checkpoint: { name: string } }) => item.checkpoint.name === 'Registration',
    );
    expect(registrationCheckpoint.completed).toBe(true);
  });
});
