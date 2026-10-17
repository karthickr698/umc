import { describe, expect, it } from 'vitest';
import mongoose, { Types, type Document } from 'mongoose';
import { COMPANY_STATUSES, USER_ROLES, USER_STATUSES } from '@umc/shared';
import { CompanyModel } from '../src/models/company.model.js';
import { UserModel } from '../src/models/user.model.js';

/** Returns the failing paths, or an empty list when the document is valid. */
async function invalidPaths(doc: Document): Promise<string[]> {
  try {
    await doc.validate();
    return [];
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) return Object.keys(err.errors);
    throw err;
  }
}

function validUser(overrides: Record<string, unknown> = {}) {
  return new UserModel({
    companyId: new Types.ObjectId(),
    name: 'Jane Doe',
    email: '  Jane@Example.COM ',
    passwordHash: 'hash',
    ...overrides,
  });
}

describe('CompanyModel', () => {
  it('requires a name and defaults status to ACTIVE', async () => {
    const company = new CompanyModel({});
    expect(await invalidPaths(company)).toContain('name');
    expect(company.status).toBe(COMPANY_STATUSES.ACTIVE);
  });

  it('rejects an unknown status and an invalid email', async () => {
    const paths = await invalidPaths(
      new CompanyModel({ name: 'Acme', status: 'NOPE', email: 'x' }),
    );
    expect(paths).toEqual(expect.arrayContaining(['status', 'email']));
  });

  it('serialises with id and without _id/__v', () => {
    const json = new CompanyModel({ name: 'Acme', address: { city: 'Pune' } }).toJSON();
    expect(json).toMatchObject({ name: 'Acme', address: { city: 'Pune' } });
    expect(json).toHaveProperty('id');
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
  });
});

describe('UserModel', () => {
  it('normalises email and applies role/status defaults', async () => {
    const user = validUser();
    expect(await invalidPaths(user)).toEqual([]);
    expect(user.email).toBe('jane@example.com');
    expect(user.role).toBe(USER_ROLES.STAFF);
    expect(user.status).toBe(USER_STATUSES.ACTIVE);
  });

  it('requires companyId, email and passwordHash', async () => {
    const paths = await invalidPaths(new UserModel({ name: 'Jane' }));
    expect(paths).toEqual(expect.arrayContaining(['companyId', 'email', 'passwordHash']));
  });

  it('rejects an unknown role', async () => {
    expect(await invalidPaths(validUser({ role: 'SUPERUSER' }))).toContain('role');
  });

  it('never serialises the password hash', () => {
    expect(validUser().toJSON()).not.toHaveProperty('passwordHash');
  });

  it('hides the password hash from queries by default', () => {
    expect(UserModel.schema.path('passwordHash').options.select).toBe(false);
  });

  it('indexes email uniquely and companyId', () => {
    const indexes = UserModel.schema.indexes();
    expect(indexes).toContainEqual([{ email: 1 }, expect.objectContaining({ unique: true })]);
    expect(indexes.some(([fields]) => Object.keys(fields)[0] === 'companyId')).toBe(true);
  });
});
