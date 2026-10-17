import { Types } from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REFRESH_TOKEN_COOKIE, USER_ROLES, USER_STATUSES } from '@umc/shared';
import { createApp } from '../src/app.js';
import * as companyRepository from '../src/repositories/company.repository.js';
import * as userRepository from '../src/repositories/user.repository.js';

vi.mock('../src/repositories/company.repository.js', () => ({ create: vi.fn() }));
vi.mock('../src/repositories/user.repository.js', () => ({
  existsByEmail: vi.fn(),
  create: vi.fn(),
}));
vi.mock('../src/repositories/refresh-token.repository.js', () => ({
  create: vi.fn().mockResolvedValue(new Types.ObjectId().toString()),
}));
vi.mock('../src/utils/transaction.js', () => ({
  withTransaction: (work: (session: unknown) => Promise<unknown>) => work({}),
}));

const REGISTER_PATH = '/api/auth/register';

const validBody = {
  companyName: 'Acme Builders',
  name: 'Asha Rao',
  email: '  Asha@Acme.test ',
  phone: '+91 98765 43210',
  password: 'correct horse',
};

function mockSuccessfulInserts() {
  const companyId = new Types.ObjectId();
  const now = new Date();
  vi.mocked(companyRepository.create).mockImplementation((company) =>
    Promise.resolve({
      ...company,
      _id: companyId,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    }),
  );
  vi.mocked(userRepository.create).mockImplementation(({ companyId: ownerCompanyId, ...user }) =>
    Promise.resolve({
      ...user,
      _id: new Types.ObjectId(),
      companyId: new Types.ObjectId(ownerCompanyId),
      status: USER_STATUSES.ACTIVE,
      createdAt: now,
      updatedAt: now,
    }),
  );
  return companyId;
}

describe('POST /api/auth/register', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userRepository.existsByEmail).mockResolvedValue(false);
  });

  it('creates a company with the registering user as OWNER and signs them in', async () => {
    const companyId = mockSuccessfulInserts();

    const res = await request(app).post(REGISTER_PATH).send(validBody);

    expect(res.status).toBe(201);
    expect(companyRepository.create).toHaveBeenCalledWith({ name: 'Acme Builders' }, {});
    const [newUser] = vi.mocked(userRepository.create).mock.calls[0] ?? [];
    expect(newUser).toMatchObject({
      companyId: companyId.toString(),
      email: 'asha@acme.test',
      role: USER_ROLES.OWNER,
    });
    expect(newUser?.passwordHash).not.toBe(validBody.password);

    expect(res.body.data).toMatchObject({
      tokenType: 'Bearer',
      accessToken: expect.any(String),
      user: { companyId: companyId.toString(), role: USER_ROLES.OWNER, email: 'asha@acme.test' },
    });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(String(res.headers['set-cookie'])).toContain(`${REFRESH_TOKEN_COOKIE}=`);
  });

  it('rejects an email that is already registered with 409', async () => {
    vi.mocked(userRepository.existsByEmail).mockResolvedValue(true);

    const res = await request(app).post(REGISTER_PATH).send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(companyRepository.create).not.toHaveBeenCalled();
  });

  it('does not let the caller choose a role', async () => {
    const res = await request(app)
      .post(REGISTER_PATH)
      .send({ ...validBody, role: USER_ROLES.STAFF });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('validates required fields and password length', async () => {
    const res = await request(app)
      .post(REGISTER_PATH)
      .send({ companyName: ' ', name: 'A', email: 'nope', password: 'short' });

    expect(res.status).toBe(400);
    const paths = (res.body.error.details as { path: string }[]).map((issue) => issue.path);
    expect(paths).toEqual(expect.arrayContaining(['companyName', 'email', 'password']));
  });
});
