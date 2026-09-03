import { describe, expect, it } from 'vitest';
import { getTestAgent, registerTestAttendee } from '../../fixtures/test-app.js';

describe('POST /api/v1/auth/refresh', () => {
  it('login now also returns a refresh token', async () => {
    const { response } = await registerTestAttendee('refresh-login');
    expect(response.body.data.refreshToken).toBeTruthy();
    expect(typeof response.body.data.refreshToken).toBe('string');
  });

  it('exchanges a valid refresh token for a new access+refresh pair', async () => {
    const { response } = await registerTestAttendee('refresh-exchange');
    const refreshToken: string = response.body.data.refreshToken;

    const res = await getTestAgent().post('/api/v1/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('rotation invalidates the old refresh token — it cannot be reused', async () => {
    const { response } = await registerTestAttendee('refresh-rotation');
    const originalRefreshToken: string = response.body.data.refreshToken;

    await getTestAgent().post('/api/v1/auth/refresh').send({ refreshToken: originalRefreshToken });

    const reuse = await getTestAgent()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefreshToken });
    expect(reuse.status).toBe(401);
  });

  it('rejects a garbage refresh token', async () => {
    const res = await getTestAgent().post('/api/v1/auth/refresh').send({ refreshToken: 'not-a-real-token' });
    expect(res.status).toBe(401);
  });

  it('the new access token from a refresh actually authorizes a request', async () => {
    const { response } = await registerTestAttendee('refresh-then-use');
    const refreshToken: string = response.body.data.refreshToken;

    const refreshed = await getTestAgent().post('/api/v1/auth/refresh').send({ refreshToken });
    const newAccessToken: string = refreshed.body.data.accessToken;

    const profile = await getTestAgent()
      .get('/api/v1/me/profile')
      .set('Authorization', `Bearer ${newAccessToken}`);
    expect(profile.status).toBe(200);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the refresh token so it can no longer be used to refresh', async () => {
    const { response } = await registerTestAttendee('logout-revokes');
    const refreshToken: string = response.body.data.refreshToken;

    const logoutRes = await getTestAgent().post('/api/v1/auth/logout').send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const afterLogout = await getTestAgent().post('/api/v1/auth/refresh').send({ refreshToken });
    expect(afterLogout.status).toBe(401);
  });

  it('does not require a still-valid access token — logout works even without one', async () => {
    const { response } = await registerTestAttendee('logout-no-auth-header');
    const refreshToken: string = response.body.data.refreshToken;

    // Deliberately no Authorization header.
    const res = await getTestAgent().post('/api/v1/auth/logout').send({ refreshToken });
    expect(res.status).toBe(200);
  });

  it('is a no-op (not an error) with no refresh token at all', async () => {
    const res = await getTestAgent().post('/api/v1/auth/logout').send({});
    expect(res.status).toBe(200);
  });
});
