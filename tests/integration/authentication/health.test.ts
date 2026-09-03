import { describe, expect, it } from 'vitest';
import { getTestAgent } from '../../fixtures/test-app.js';

describe('GET /health', () => {
  it('reports liveness without touching the database', async () => {
    const res = await getTestAgent().get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data).not.toHaveProperty('database');
    expect(res.body.data.environment).toBe('test');
    expect(typeof res.body.data.timestamp).toBe('string');
  });
});

describe('GET /ready', () => {
  it('reports ready with a connected database, as 200', async () => {
    const res = await getTestAgent().get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ready');
    expect(res.body.data.database).toBe('connected');
    expect(res.body.data.environment).toBe('test');
  });
});
