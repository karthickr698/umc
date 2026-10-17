import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('health routes', () => {
  it('GET /api/health returns liveness status in the success envelope', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { database: 'disconnected', status: 'degraded' },
      meta: { timestamp: expect.any(String), requestId: expect.any(String) },
    });
  });

  it('GET /api/health/ready returns a 503 failure envelope when the database is not connected', async () => {
    const res = await request(app).get('/api/health/ready');

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service is not ready',
        details: { database: 'disconnected', status: 'degraded' },
      },
      meta: { timestamp: expect.any(String) },
    });
  });

  it('unknown routes return a structured 404', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });
});
