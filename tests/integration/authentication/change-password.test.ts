import { describe, expect, it } from 'vitest';
import { getTestAgent, registerTestAttendee, VALID_TEST_PASSWORD } from '../../fixtures/test-app.js';

describe('POST /auth/change-password', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await getTestAgent()
      .post('/api/v1/auth/change-password')
      .send({ currentPassword: 'x', newPassword: 'NewPassw0rd!' });
    expect(res.status).toBe(401);
  });

  it('rejects the wrong current password', async () => {
    const { response } = await registerTestAttendee('change-pw-wrong');
    const token = response.body.data.accessToken;

    const res = await getTestAgent()
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'DefinitelyWrong1', newPassword: 'NewPassw0rd!' });
    expect(res.status).toBe(422);
  });

  it('changes the password, revokes prior sessions, and logs in with the new password', async () => {
    const { email, response } = await registerTestAttendee('change-pw-ok');
    const oldRefreshToken: string = response.body.data.refreshToken;
    const accessToken: string = response.body.data.accessToken;

    const changeRes = await getTestAgent()
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: VALID_TEST_PASSWORD, newPassword: 'BrandNewPassw0rd!' });
    expect(changeRes.status).toBe(200);
    expect(changeRes.body.data.accessToken).toBeTruthy();

    // The pre-change refresh token no longer works.
    const staleRefresh = await getTestAgent()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefreshToken });
    expect(staleRefresh.status).toBe(401);

    // Old password no longer works; new one does.
    const oldLogin = await getTestAgent()
      .post('/api/v1/auth/login')
      .send({ email, password: VALID_TEST_PASSWORD });
    expect(oldLogin.status).toBe(401);

    const newLogin = await getTestAgent()
      .post('/api/v1/auth/login')
      .send({ email, password: 'BrandNewPassw0rd!' });
    expect(newLogin.status).toBe(200);
  });
});
