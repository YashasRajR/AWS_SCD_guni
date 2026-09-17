import { describe, expect, it } from 'vitest';
import {
  getTestAgent,
  loginAs,
  registerAndCreatePendingRegistration,
} from '../../fixtures/test-app.js';

async function tokenFor(): Promise<string> {
  const res = await loginAs('admin@dev.local', 'DevPassw0rd!');
  return res.body.data.accessToken as string;
}

async function findAttendeeIdByFullName(adminToken: string, fullName: string): Promise<string> {
  const res = await getTestAgent()
    .get('/api/v1/admin/attendees')
    .query({ search: fullName, pageSize: 50 })
    .set('Authorization', `Bearer ${adminToken}`);
  const match = res.body.data.items.find((a: { fullName: string }) => a.fullName === fullName);
  if (!match) throw new Error(`Attendee "${fullName}" not found via admin search`);
  return match.id;
}

/**
 * Public certificate verification (/api/v1/certificates/verify/:number) has
 * no authentication, so its contract is deliberately narrow: it must never
 * leak attendee contact info, and it must not distinguish "revoked" from
 * "never existed" (both come back valid:false) so a caller can't probe
 * which certificate numbers are real.
 */
describe('Certificate verification (public)', () => {
  it('reports an unknown certificate number as invalid, with no data leak', async () => {
    const res = await getTestAgent().get('/api/v1/certificates/verify/CERT-DOES-NOT-EXIST');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ valid: false, certificateNumber: 'CERT-DOES-NOT-EXIST' });
  });

  it('issues, verifies, then revokes a certificate end to end, without leaking attendee contact info', async () => {
    const admin = await tokenFor();
    const { registrationId } = await registerAndCreatePendingRegistration('cert-flow');
    const fullName = 'Test Attendee cert-flow';

    await getTestAgent()
      .patch(`/api/v1/admin/registrations/${registrationId}/status`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'CONFIRMED' });

    const attendeeId = await findAttendeeIdByFullName(admin, fullName);

    const issued = await getTestAgent()
      .post('/api/v1/admin/certificates')
      .set('Authorization', `Bearer ${admin}`)
      .send({ attendeeId, title: 'Certificate of Participation' });
    expect(issued.status).toBe(201);
    const certificateNumber = issued.body.data.certificateNumber;

    const verified = await getTestAgent().get(`/api/v1/certificates/verify/${certificateNumber}`);
    expect(verified.status).toBe(200);
    expect(verified.body.data.valid).toBe(true);
    expect(verified.body.data.certificateNumber).toBe(certificateNumber);
    expect(verified.body.data).not.toHaveProperty('attendeeId');
    expect(verified.body.data).not.toHaveProperty('email');

    await getTestAgent()
      .patch(`/api/v1/admin/certificates/${issued.body.data.id}/revoke`)
      .set('Authorization', `Bearer ${admin}`);

    const afterRevoke = await getTestAgent().get(`/api/v1/certificates/verify/${certificateNumber}`);
    expect(afterRevoke.body.data.valid).toBe(false);
  });

  it('refuses to issue a certificate to an attendee without a confirmed registration', async () => {
    const admin = await tokenFor();
    const { registrationId } = await registerAndCreatePendingRegistration('cert-ineligible');
    void registrationId; // left PENDING on purpose
    const fullName = 'Test Attendee cert-ineligible';
    const attendeeId = await findAttendeeIdByFullName(admin, fullName);

    const res = await getTestAgent()
      .post('/api/v1/admin/certificates')
      .set('Authorization', `Bearer ${admin}`)
      .send({ attendeeId, title: 'Certificate of Participation' });

    expect(res.status).toBe(422);
  });
});
