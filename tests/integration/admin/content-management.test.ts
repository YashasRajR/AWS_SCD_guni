import { describe, expect, it, beforeAll } from 'vitest';
import { getTestAgent, getTestPool, loginAs } from '../../fixtures/test-app.js';

let adminToken: string;
let attendeeToken: string;
let attendeeEmail: string;

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

  it('rejects an ATTENDEE trying to update a registration status', async () => {
    const res = await getTestAgent()
      .patch(`/api/v1/admin/registrations/00000000-0000-0000-0000-000000000000/status`)
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(403);
  });
});
