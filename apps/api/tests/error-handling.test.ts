import express, { type RequestHandler } from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { errorHandler } from '../src/middlewares/error-handler.js';
import { requestLogger } from '../src/middlewares/request-logger.js';
import { ApiError } from '../src/utils/api-error.js';
import { sendSuccess } from '../src/utils/api-response.js';

const WidgetModel = mongoose.model(
  'ErrorHandlingWidget',
  new mongoose.Schema({
    name: { type: String, required: true },
    qty: { type: Number, min: 1 },
  }),
);

function throwing(error: unknown): RequestHandler {
  return async () => {
    await Promise.resolve();
    throw error;
  };
}

function buildTestApp() {
  const app = express();
  app.use(requestLogger);
  app.use(express.json({ limit: '100b' }));

  app.get('/ok', (_req, res) => sendSuccess(res, { hello: 'world' }));
  app.get('/api-error', throwing(ApiError.conflict('Already exists')));
  app.get('/unknown', () => Promise.reject(new Error('secret connection string')));
  app.get('/non-error', throwing('just a string'));
  app.post('/zod', (req, res) => {
    sendSuccess(res, z.object({ name: z.string(), tags: z.array(z.string()) }).parse(req.body));
  });
  app.get('/mongoose-validation', async () => {
    await new WidgetModel({ qty: 0 }).validate();
  });
  app.get('/mongoose-cast', async () => {
    await new WidgetModel({ name: 'a', qty: 'not-a-number' }).validate();
  });
  app.get('/cast', throwing(new mongoose.Error.CastError('ObjectId', 'abc', '_id')));
  app.get(
    '/duplicate',
    throwing(
      new mongoose.mongo.MongoServerError({
        message: 'E11000 duplicate key error collection: umc.users index: email_1',
        code: 11000,
        keyValue: { email: 'a@b.c' },
      }),
    ),
  );
  app.get('/not-found-doc', throwing(new mongoose.Error.DocumentNotFoundError('Widget not found')));
  app.get('/db-down', throwing(new mongoose.mongo.MongoNotConnectedError('not connected')));

  app.use(errorHandler);
  return app;
}

describe('response envelope', () => {
  const app = buildTestApp();

  it('wraps success payloads with meta and a request id', async () => {
    const res = await request(app).get('/ok');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { hello: 'world' },
      meta: { timestamp: expect.any(String), requestId: res.headers['x-request-id'] },
    });
  });

  it('reuses a valid incoming X-Request-Id', async () => {
    const res = await request(app).get('/api-error').set('X-Request-Id', 'trace-123');

    expect(res.headers['x-request-id']).toBe('trace-123');
    expect(res.body.meta.requestId).toBe('trace-123');
  });

  it('replaces an unsafe incoming X-Request-Id', async () => {
    const res = await request(app).get('/ok').set('X-Request-Id', 'bad id\twith spaces');

    expect(res.body.meta.requestId).not.toBe('bad id\twith spaces');
    expect(res.body.meta.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('error handling', () => {
  const app = buildTestApp();

  it('sends ApiError status, code and message as-is', async () => {
    const res = await request(app).get('/api-error');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'CONFLICT', message: 'Already exists' },
      meta: { timestamp: expect.any(String), requestId: expect.any(String) },
    });
  });

  it('turns unknown errors into a generic 500 (debug details only outside production)', async () => {
    const res = await request(app).get('/unknown');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: { name: 'Error', message: 'secret connection string' },
    });
  });

  it('handles non-Error throwables', async () => {
    const res = await request(app).get('/non-error');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('maps Zod errors to 400 VALIDATION_ERROR with field issues', async () => {
    const res = await request(app)
      .post('/zod')
      .send({ name: 42, tags: ['ok', 1] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([
      { path: 'name', message: expect.any(String), code: 'invalid_type' },
      { path: 'tags.1', message: expect.any(String), code: 'invalid_type' },
    ]);
  });

  it('maps Mongoose validation errors to 400 VALIDATION_ERROR with field issues', async () => {
    const res = await request(app).get('/mongoose-validation');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'name', code: 'required' }),
        expect.objectContaining({ path: 'qty', code: 'min' }),
      ]),
    );
  });

  it('does not echo raw values from Mongoose cast errors', async () => {
    const res = await request(app).get('/mongoose-cast');

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { path: 'qty', message: 'Invalid Number', code: 'invalid_type' },
    ]);
  });

  it('maps CastError to 400 VALIDATION_ERROR', async () => {
    const res = await request(app).get('/cast');

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: [{ path: '_id', message: 'Invalid ObjectId', code: 'invalid_type' }],
    });
  });

  it('maps duplicate key errors to 409 CONFLICT without leaking values', async () => {
    const res = await request(app).get('/duplicate');

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({
      code: 'CONFLICT',
      message: 'Duplicate value for email',
      details: { fields: ['email'] },
    });
  });

  it('maps DocumentNotFoundError to 404', async () => {
    const res = await request(app).get('/not-found-doc');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('maps MongoDB connection errors to 503', async () => {
    const res = await request(app).get('/db-down');

    expect(res.status).toBe(503);
    expect(res.body.error).toEqual({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Database is temporarily unavailable',
    });
  });

  it('maps oversized bodies to 413 PAYLOAD_TOO_LARGE', async () => {
    const res = await request(app)
      .post('/zod')
      .send({ name: 'x'.repeat(200), tags: [] });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('maps malformed JSON bodies to 400 BAD_REQUEST', async () => {
    const res = await request(createApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Malformed JSON body' },
    });
  });
});
