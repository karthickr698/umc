import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COMPANY_STATUSES, SITE_STATUSES, USER_ROLES, USER_STATUSES } from '@umc/shared';
import * as clientRepository from '../src/repositories/client.repository.js';
import * as companyRepository from '../src/repositories/company.repository.js';
import * as siteRepository from '../src/repositories/site.repository.js';
import * as userRepository from '../src/repositories/user.repository.js';
import * as adminService from '../src/services/admin.service.js';

vi.mock('../src/repositories/company.repository.js', () => ({
  list: vi.fn(),
  findById: vi.fn(),
  findNamesByIds: vi.fn(),
}));
vi.mock('../src/repositories/user.repository.js', () => ({
  findByCompanyIds: vi.fn(),
  countByCompanyIds: vi.fn(),
}));
vi.mock('../src/repositories/site.repository.js', () => ({
  countByCompanyIds: vi.fn(),
  listAll: vi.fn(),
}));
vi.mock('../src/repositories/client.repository.js', () => ({ findNamesByIds: vi.fn() }));

const now = new Date();
const acmeId = new Types.ObjectId();
const betaId = new Types.ObjectId();

function company(id: Types.ObjectId, name: string) {
  return { _id: id, name, status: COMPANY_STATUSES.ACTIVE, createdAt: now, updatedAt: now };
}

function owner(companyId: Types.ObjectId, name: string) {
  return {
    _id: new Types.ObjectId(),
    companyId,
    name,
    email: `${name.toLowerCase()}@example.test`,
    passwordHash: 'unused',
    role: USER_ROLES.OWNER,
    status: USER_STATUSES.ACTIVE,
    createdAt: now,
    updatedAt: now,
  };
}

describe('admin service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists companies with their owners and counts', async () => {
    vi.mocked(companyRepository.list).mockResolvedValue({
      items: [company(acmeId, 'Acme'), company(betaId, 'Beta')],
      total: 2,
    });
    vi.mocked(userRepository.findByCompanyIds).mockResolvedValue([owner(acmeId, 'Asha')]);
    vi.mocked(userRepository.countByCompanyIds).mockResolvedValue(
      new Map([[acmeId.toString(), 3]]),
    );
    vi.mocked(siteRepository.countByCompanyIds).mockResolvedValue(
      new Map([[betaId.toString(), 5]]),
    );

    const result = await adminService.listCompanies({ page: 1, pageSize: 20 });

    expect(userRepository.findByCompanyIds).toHaveBeenCalledWith(
      [acmeId.toString(), betaId.toString()],
      USER_ROLES.OWNER,
    );
    expect(result.meta.total).toBe(2);
    expect(result.items).toMatchObject([
      { name: 'Acme', userCount: 3, siteCount: 0, owners: [{ name: 'Asha' }] },
      { name: 'Beta', userCount: 0, siteCount: 5, owners: [] },
    ]);
    expect(result.items[0]?.owners[0]).not.toHaveProperty('passwordHash');
  });

  it('lists sites across companies with company and client names', async () => {
    const clientId = new Types.ObjectId();
    vi.mocked(siteRepository.listAll).mockResolvedValue({
      items: [
        {
          _id: new Types.ObjectId(),
          companyId: acmeId,
          clientId,
          name: 'Tower A',
          code: 'TWR-A',
          status: SITE_STATUSES.ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
      ],
      total: 1,
    });
    vi.mocked(companyRepository.findNamesByIds).mockResolvedValue(
      new Map([[acmeId.toString(), 'Acme']]),
    );
    vi.mocked(clientRepository.findNamesByIds).mockResolvedValue(
      new Map([[clientId.toString(), 'Mehta Family']]),
    );

    const result = await adminService.listSites({
      page: 1,
      pageSize: 20,
      companyId: acmeId.toString(),
    });

    expect(siteRepository.listAll).toHaveBeenCalledWith(
      { companyId: acmeId.toString() },
      { skip: 0, limit: 20 },
    );
    expect(result.items).toMatchObject([
      { name: 'Tower A', companyName: 'Acme', clientName: 'Mehta Family' },
    ]);
  });

  it('reports an unknown company as 404', async () => {
    vi.mocked(companyRepository.findById).mockResolvedValue(null);

    await expect(adminService.getCompany(new Types.ObjectId().toString())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
