import {
  USER_ROLES,
  type AdminCompanyDetailDto,
  type AdminCompanySummaryDto,
  type AdminSiteDetailDto,
  type AdminSiteDto,
  type Paginated,
  type UserDto,
} from '@umc/shared';
import * as clientRepository from '../repositories/client.repository.js';
import * as companyRepository from '../repositories/company.repository.js';
import type { CompanyRecord } from '../repositories/company.repository.js';
import * as siteRepository from '../repositories/site.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import { ApiError } from '../utils/api-error.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type {
  AdminListCompaniesInput,
  AdminListSitesInput,
} from '../validators/admin.validator.js';
import { toClientDto } from './client.service.js';
import { toCompanyDto } from './company.service.js';
import { siteTotals } from './dashboard.service.js';
import { toSiteDto } from './site.service.js';
import { toUserDto } from './user.service.js';

// Cross-company, read-only views for SUPER_ADMIN. Routes guard access with `viewPlatform`.

const COMPANY_NOT_FOUND = 'Company not found';
const SITE_NOT_FOUND = 'Site not found';

function groupByCompany(users: UserDto[]): Map<string, UserDto[]> {
  const groups = new Map<string, UserDto[]>();
  for (const user of users) {
    if (user.companyId === null) continue;
    groups.set(user.companyId, [...(groups.get(user.companyId) ?? []), user]);
  }
  return groups;
}

async function summarizeCompanies(companies: CompanyRecord[]): Promise<AdminCompanySummaryDto[]> {
  const ids = companies.map((company) => company._id.toString());
  const [owners, userCounts, siteCounts] = await Promise.all([
    userRepository.findByCompanyIds(ids, USER_ROLES.OWNER),
    userRepository.countByCompanyIds(ids),
    siteRepository.countByCompanyIds(ids),
  ]);
  const ownersByCompany = groupByCompany(owners.map(toUserDto));

  return companies.map((company) => {
    const id = company._id.toString();
    return {
      ...toCompanyDto(company),
      owners: ownersByCompany.get(id) ?? [],
      userCount: userCounts.get(id) ?? 0,
      siteCount: siteCounts.get(id) ?? 0,
    };
  });
}

export async function listCompanies(
  query: AdminListCompaniesInput,
): Promise<Paginated<AdminCompanySummaryDto>> {
  const { page, pageSize, ...filter } = query;
  const { items, total } = await companyRepository.list(filter, toSkipLimit({ page, pageSize }));
  return toPaginated(await summarizeCompanies(items), total, { page, pageSize });
}

export async function getCompany(id: string): Promise<AdminCompanyDetailDto> {
  const company = await companyRepository.findById(id);
  if (!company) throw ApiError.notFound(COMPANY_NOT_FOUND);

  const [[summary], users] = await Promise.all([
    summarizeCompanies([company]),
    userRepository.findByCompanyIds([id]),
  ]);
  if (!summary) throw ApiError.notFound(COMPANY_NOT_FOUND);
  return { ...summary, users: users.map(toUserDto) };
}

export async function listSites(query: AdminListSitesInput): Promise<Paginated<AdminSiteDto>> {
  const { page, pageSize, ...filter } = query;
  const { items, total } = await siteRepository.listAll(filter, toSkipLimit({ page, pageSize }));
  const unique = (ids: string[]) => [...new Set(ids)];
  const [companyNames, clientNames] = await Promise.all([
    companyRepository.findNamesByIds(unique(items.map((site) => site.companyId.toString()))),
    clientRepository.findNamesByIds(unique(items.map((site) => site.clientId.toString()))),
  ]);

  return toPaginated(
    items.map((site) => ({
      ...toSiteDto(site),
      companyName: companyNames.get(site.companyId.toString()) ?? '',
      clientName: clientNames.get(site.clientId.toString()) ?? '',
    })),
    total,
    { page, pageSize },
  );
}

export async function getSite(id: string): Promise<AdminSiteDetailDto> {
  const site = await siteRepository.findAnyById(id);
  if (!site) throw ApiError.notFound(SITE_NOT_FOUND);

  const companyId = site.companyId.toString();
  const [company, owners, client, totals] = await Promise.all([
    companyRepository.findById(companyId),
    userRepository.findByCompanyIds([companyId], USER_ROLES.OWNER),
    clientRepository.findByIdInCompany(companyId, site.clientId.toString()),
    siteTotals(companyId, id),
  ]);
  // Sites always reference an existing company and client; a miss means broken data.
  if (!company || !client) throw new Error(`Site ${id} references a missing company or client`);

  return {
    site: toSiteDto(site),
    company: toCompanyDto(company),
    owners: owners.map(toUserDto),
    client: toClientDto(client),
    totals,
  };
}
