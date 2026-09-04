import { describe, expect, it } from 'vitest';
import { getTestAgent } from '../../fixtures/test-app.js';

describe('CORS origin allowlist', () => {
  it('does not echo back an unauthorized origin in Access-Control-Allow-Origin', async () => {
    const res = await getTestAgent()
      .get('/health')
      .set('Origin', 'https://evil.example.com');

    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example.com');
  });

  it('echoes back an allowed dev origin', async () => {
    // http://localhost:5173 is PUBLIC_APP_URL's default (backend/src/config/env.ts).
    const res = await getTestAgent().get('/health').set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
