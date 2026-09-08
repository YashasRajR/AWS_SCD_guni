import { describe, expect, it, beforeAll } from 'vitest';
import { getTestAgent, getTestPool, loginAs } from '../../fixtures/test-app.js';

let adminToken: string;
let attendeeToken: string;
let attendeeEmail: string;
let eventId: string;

beforeAll(async () => {
  const adminLogin = await loginAs('admin@dev.local', 'DevPassw0rd!');
  adminToken = adminLogin.body.data.accessToken as string;

  attendeeEmail = `test-content-attendee-${Date.now()}@example.test`;
  const attendeeRegister = await getTestAgent().post('/api/v1/auth/register').send({
    email: attendeeEmail,
    password: 'TestPassw0rd!',
    fullName: 'Content Test Attendee',
    registrationType: 'STUDENT',
    phone: '+919876543210',
    dateOfBirth: '2000-01-01',
    university: 'Test University',
    department: 'Computer Science',
    branch: 'CSE',
    year: '2026',
    consent: true,
  });
  attendeeToken = attendeeRegister.body.data.accessToken as string;

  const eventRes = await getTestAgent().get('/api/v1/event');
  eventId = eventRes.body.data.id as string;
});

describe('Admin speaker CRUD', () => {
  it('rejects an ATTENDEE trying to create a speaker', async () => {
    const res = await getTestAgent()
      .post('/api/v1/admin/content/speakers')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ name: 'Should Not Work' });
    expect(res.status).toBe(403);
  });

  it('lets an ADMIN create, update, and delete a speaker, invisible to the public list until PUBLISHED', async () => {
    const create = await getTestAgent()
      .post('/api/v1/admin/content/speakers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dr. Jane Test', organization: 'Test University', status: 'DRAFT' });
    expect(create.status).toBe(201);
    const speakerId = create.body.data.id as string;
    expect(create.body.data.status).toBe('DRAFT');

    // DRAFT speakers don't show up on the public list.
    const publicListBeforePublish = await getTestAgent().get('/api/v1/speakers');
    expect(
      publicListBeforePublish.body.data.find((s: { id: string }) => s.id === speakerId),
    ).toBeUndefined();

    // Admin list shows every status.
    const adminList = await getTestAgent()
      .get('/api/v1/admin/content/speakers')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminList.status).toBe(200);
    expect(adminList.body.data.items.some((s: { id: string }) => s.id === speakerId)).toBe(true);

    const update = await getTestAgent()
      .patch(`/api/v1/admin/content/speakers/${speakerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PUBLISHED', designation: 'Keynote Speaker' });
    expect(update.status).toBe(200);
    expect(update.body.data.status).toBe('PUBLISHED');
    expect(update.body.data.designation).toBe('Keynote Speaker');

    const publicListAfterPublish = await getTestAgent().get('/api/v1/speakers');
    expect(publicListAfterPublish.body.data.some((s: { id: string }) => s.id === speakerId)).toBe(true);

    const remove = await getTestAgent()
      .delete(`/api/v1/admin/content/speakers/${speakerId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(remove.status).toBe(200);

    const afterDelete = await getTestAgent().get('/api/v1/speakers');
    expect(afterDelete.body.data.some((s: { id: string }) => s.id === speakerId)).toBe(false);
  });
});

describe('Admin checkpoint CRUD', () => {
  it('lets an ADMIN create and update a checkpoint', async () => {
    const create = await getTestAgent()
      .post('/api/v1/admin/checkpoints')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ eventId, name: `Photo Booth ${Date.now()}`, isRequired: false });
    expect(create.status).toBe(201);
    const checkpointId = create.body.data.id as string;

    const update = await getTestAgent()
      .patch(`/api/v1/admin/checkpoints/${checkpointId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isRequired: true, location: 'Main Hall' });
    expect(update.status).toBe(200);
    expect(update.body.data.isRequired).toBe(true);
    expect(update.body.data.location).toBe('Main Hall');
  });

  it('rejects a duplicate checkpoint name for the same event', async () => {
    const name = `Duplicate Checkpoint ${Date.now()}`;
    const first = await getTestAgent()
      .post('/api/v1/admin/checkpoints')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ eventId, name });
    expect(first.status).toBe(201);

    const second = await getTestAgent()
      .post('/api/v1/admin/checkpoints')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ eventId, name });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('DUPLICATE_RESOURCE');
  });
});

describe('Admin registration status update', () => {
  it('lets an ADMIN confirm a PENDING registration', async () => {
    // No API path creates a registration yet in this phase (the payment/
    // confirmation flow is a later phase) — seed one directly against the
    // attendee this suite already registered in beforeAll.
    const profile = await getTestAgent()
      .get('/api/v1/me/profile')
      .set('Authorization', `Bearer ${attendeeToken}`);
    const attendeeId = profile.body.data.id as string;

    const pool = getTestPool();
    const regInsert = await pool.query(
      `INSERT INTO registrations (attendee_id, registration_number) VALUES ($1, $2) RETURNING id, status`,
      [attendeeId, `REG-TEST-${Date.now()}`],
    );
    const registrationId = regInsert.rows[0].id as string;
    expect(regInsert.rows[0].status).toBe('PENDING');

    const res = await getTestAgent()
      .patch(`/api/v1/admin/registrations/${registrationId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.confirmedAt).not.toBeNull();
  });

  it('rejects a VOLUNTEER trying to update a registration status', async () => {
    const volunteerLogin = await loginAs('volunteer@dev.local', 'DevPassw0rd!');
    const volunteerToken = volunteerLogin.body.data.accessToken as string;
    const res = await getTestAgent()
      .patch(`/api/v1/admin/registrations/00000000-0000-0000-0000-000000000000/status`)
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(403);
  });
});

describe('Admin volunteer management', () => {
  it('promotes an already-registered attendee to volunteer and assigns a checkpoint', async () => {
    const create = await getTestAgent()
      .post('/api/v1/admin/volunteers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: attendeeEmail, name: 'Promoted Volunteer' });
    expect(create.status).toBe(201);
    const volunteerId = create.body.data.id as string;

    // The promoted user's next login carries the VOLUNTEER role/permissions
    // (roles are embedded in the JWT at issuance) and can reach /volunteer/me.
    const relogin = await loginAs(attendeeEmail, 'TestPassw0rd!');
    const volunteerToken = relogin.body.data.accessToken as string;
    const me = await getTestAgent()
      .get('/api/v1/volunteer/me')
      .set('Authorization', `Bearer ${volunteerToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.id).toBe(volunteerId);

    const checkpoints = await getTestAgent()
      .get('/api/v1/admin/checkpoints?pageSize=1')
      .set('Authorization', `Bearer ${adminToken}`);
    const checkpointId = checkpoints.body.data.items[0].id as string;

    const assign = await getTestAgent()
      .post(`/api/v1/admin/volunteers/${volunteerId}/checkpoints`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ checkpointId });
    expect(assign.status).toBe(201);

    const assigned = await getTestAgent()
      .get(`/api/v1/admin/volunteers/${volunteerId}/checkpoints`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(assigned.body.data.some((c: { id: string }) => c.id === checkpointId)).toBe(true);

    const revoke = await getTestAgent()
      .delete(`/api/v1/admin/volunteers/${volunteerId}/checkpoints/${checkpointId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(revoke.status).toBe(200);

    const afterRevoke = await getTestAgent()
      .get(`/api/v1/admin/volunteers/${volunteerId}/checkpoints`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(afterRevoke.body.data.some((c: { id: string }) => c.id === checkpointId)).toBe(false);
  });

  it('rejects promoting the same user twice', async () => {
    const res = await getTestAgent()
      .post('/api/v1/admin/volunteers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: attendeeEmail, name: 'Promoted Volunteer Again' });
    expect(res.status).toBe(409);
  });

  it('rejects promoting an email with no account', async () => {
    const res = await getTestAgent()
      .post('/api/v1/admin/volunteers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'nobody-registered@example.test', name: 'Ghost' });
    expect(res.status).toBe(422);
  });
});
