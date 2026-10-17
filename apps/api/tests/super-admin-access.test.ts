import { Types } from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  USER_ROLES,
  USER_STATUSES,
  canManageRole,
  type Paginated,
  type AdminCompanySummaryDto,
  type UserRole,
} from '@umc/shared';
import { createApp } from '../src/app.js';
import { UserModel } from '../src/models/user.model.js';
import * as userRepository from '../src/repositories/user.repository.js';
import type { UserRecord } from '../src/repositories/user.repository.js';
import * as adminService from '../src/services/admin.service.js';
import { signAccessToken } from '../src/utils/jwt.js';

vi.mock('../src/repositories/user.repository.js', () => ({ findById: vi.fn() }));
vi.mock('../src/services/admin.service.js', () => ({
  listCompanies: vi.fn(),
  getCompany: vi.fn(),
  listSites: vi.fn(),
  getSite: vi.fn(),
}));

const emptyPage: Paginated<AdminCompanySummaryDto> = {
  items: [],
  meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
};

/** Signs a token for a user that the mocked repository will resolve as active. */
function tokenFor(role: UserRole): string {
  const id = new Types.ObjectId();
  const companyId = role === USER_ROLES.SUPER_ADMIN ? undefined : new Types.ObjectId();
  const now = new Date();
  const record: UserRecord = {
    _id: id,
    ...(companyId && { companyId }),
    name: 'Test User',
    email: `${role.toLowerCase()}@example.test`,
    passwordHash: 'unused',
    role,
    status: USER_STATUSES.ACTIVE,
    createdAt: now,
    updatedAt: now,
  };
  vi.mocked(userRepository.findById).mockImplementation((requested) =>
    Promise.resolve(requested === id.toString() ? record : null),
  );
  return signAccessToken({ sub: id.toString(), companyId: companyId?.toString() ?? null, role });
}

describe('SUPER_ADMIN access', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminService.listCompanies).mockResolvedValue(emptyPage);
  });

  it('lets a super admin list every company', async () => {
    const res = await request(app)
      .get('/api/admin/companies')
      .auth(tokenFor(USER_ROLES.SUPER_ADMIN), { type: 'bearer' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(emptyPage);
    expect(adminService.listCompanies).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  });

  it.each([USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF])(
    'forbids %s from the admin endpoints',
    async (role) => {
      const res = await request(app)
        .get('/api/admin/sites')
        .auth(tokenFor(role), { type: 'bearer' });

      expect(res.status).toBe(403);
      expect(adminService.listSites).not.toHaveBeenCalled();
    },
  );

  it('keeps a super admin out of company-scoped endpoints', async () => {
    const res = await request(app)
      .get('/api/sites')
      .auth(tokenFor(USER_ROLES.SUPER_ADMIN), { type: 'bearer' });

    expect(res.status).toBe(403);
  });

  it('returns the super admin profile from /auth/me with no company', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .auth(tokenFor(USER_ROLES.SUPER_ADMIN), { type: 'bearer' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ role: USER_ROLES.SUPER_ADMIN, companyId: null });
  });

  it('rejects SUPER_ADMIN as a role in user management', async () => {
    const res = await request(app)
      .post('/api/users')
      .auth(tokenFor(USER_ROLES.OWNER), { type: 'bearer' })
      .send({
        name: 'Sneaky',
        email: 'sneaky@example.test',
        password: 'long enough password',
        role: USER_ROLES.SUPER_ADMIN,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('never lets anyone manage the SUPER_ADMIN role', () => {
    expect(canManageRole(USER_ROLES.OWNER, USER_ROLES.SUPER_ADMIN)).toBe(false);
    expect(canManageRole(USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF)).toBe(false);
    expect(canManageRole(USER_ROLES.OWNER, USER_ROLES.ADMIN)).toBe(true);
  });
});

describe('UserModel company rules', () => {
  const base = { name: 'A', email: 'a@example.test', passwordHash: 'hash' };

  it('allows a super admin without a company', async () => {
    await expect(
      new UserModel({ ...base, role: USER_ROLES.SUPER_ADMIN }).validate(),
    ).resolves.toBeUndefined();
  });

  it('requires a company for every other role', async () => {
    await expect(new UserModel({ ...base, role: USER_ROLES.OWNER }).validate()).rejects.toThrow(
      /Company is required/,
    );
  });

  it('refuses a super admin attached to a company', async () => {
    await expect(
      new UserModel({
        ...base,
        role: USER_ROLES.SUPER_ADMIN,
        companyId: new Types.ObjectId(),
      }).validate(),
    ).rejects.toThrow(/cannot belong to a company/);
  });
});
