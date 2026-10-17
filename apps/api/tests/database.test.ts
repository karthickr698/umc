import { describe, expect, it } from 'vitest';
import {
  checkDatabaseHealth,
  connectDatabase,
  disconnectDatabase,
  redactConnectionString,
} from '../src/config/database.js';

describe('redactConnectionString', () => {
  it('removes credentials and query options', () => {
    expect(
      redactConnectionString(
        'mongodb+srv://admin:s3cret@cluster0.example.net/umc?authSource=admin',
      ),
    ).toBe('mongodb+srv://***@cluster0.example.net/umc');
  });

  it('leaves credential-free URLs readable', () => {
    expect(redactConnectionString('mongodb://localhost:27017/umc')).toBe(
      'mongodb://localhost:27017/umc',
    );
  });
});

describe('database connection', () => {
  it('reports disconnected without pinging when not connected', async () => {
    await expect(checkDatabaseHealth()).resolves.toEqual({ status: 'disconnected' });
  });

  it('fails with an actionable, credential-free error when MongoDB is unreachable', async () => {
    const error = await connectDatabase('mongodb://user:pw@127.0.0.1:1/umc')
      .then(() => undefined)
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('mongodb://***@127.0.0.1:1/umc');
    expect((error as Error).message).not.toContain('pw');
    await disconnectDatabase();
  });

  it('disconnecting when never connected is a no-op', async () => {
    await expect(disconnectDatabase()).resolves.toBeUndefined();
  });
});
