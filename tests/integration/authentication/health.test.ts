import { describe, expect, it } from 'vitest';
import { getTestAgent } from '../../fixtures/test-app.js';

describe('GET /health', () => {
  it('reports ok status and a connected database', async () => {
    const res = await getTestAgent().get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('connected');
    expect(res.body.data.environment).toBe('test');
    expect(typeof res.body.data.timestamp).toBe('string');
  });
});
