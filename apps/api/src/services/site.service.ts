import { SITE_CODE_FORMAT, type Paginated, type SiteDto, type TenantUserDto } from '@umc/shared';
import * as clientPaymentRepository from '../repositories/client-payment.repository.js';
import * as expenseRepository from '../repositories/expense.repository.js';
import * as paymentRepository from '../repositories/payment.repository.js';
import * as siteRepository from '../repositories/site.repository.js';
import type { SiteRecord } from '../repositories/site.repository.js';
import * as workAssignmentRepository from '../repositories/work-assignment.repository.js';
import { ApiError } from '../utils/api-error.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type {
  CreateSiteInput,
  ListSitesInput,
  UpdateSiteInput,
} from '../validators/site.validator.js';
import { assertClientInCompany } from './client.service.js';
import { nextSequentialCode } from './sequential-code.service.js';

const SITE_NOT_FOUND = 'Site not found';

export function toSiteDto(site: SiteRecord): SiteDto {
  return {
    id: site._id.toString(),
    companyId: site.companyId.toString(),
    clientId: site.clientId.toString(),
    name: site.name,
    code: site.code,
    ...(site.address !== undefined && { address: site.address }),
    status: site.status,
    ...(site.startDate !== undefined && { startDate: site.startDate.toISOString() }),
    createdAt: site.createdAt.toISOString(),
    updatedAt: site.updatedAt.toISOString(),
  };
}

/** Owning company of a site, for `requireCompanyOwnership`; `null` when it does not exist. */
export function findCompanyId(id: string): Promise<string | null> {
  return siteRepository.findCompanyIdById(id);
}

/** A site from another company is reported as missing so its id cannot be probed. */
export async function assertSiteOfClient(
  companyId: string,
  siteId: string,
  clientId: string,
): Promise<void> {
  const site = await siteRepository.findByIdInCompany(companyId, siteId);
  if (!site) throw ApiError.validation([{ path: 'siteId', message: SITE_NOT_FOUND }]);
  if (site.clientId.toString() !== clientId) {
    throw ApiError.validation([{ path: 'siteId', message: 'Site does not belong to this client' }]);
  }
}

function nextSiteCode(companyId: string): Promise<string> {
  return nextSequentialCode(companyId, 'site', SITE_CODE_FORMAT, (code) =>
    siteRepository.existsByCode(companyId, code),
  );
}

export async function list(
  actor: TenantUserDto,
  query: ListSitesInput,
): Promise<Paginated<SiteDto>> {
  const { page, pageSize, ...filter } = query;
  const { items, total } = await siteRepository.listByCompany(
    actor.companyId,
    filter,
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(items.map(toSiteDto), total, { page, pageSize });
}

export async function getById(actor: TenantUserDto, id: string): Promise<SiteDto> {
  const site = await siteRepository.findByIdInCompany(actor.companyId, id);
  if (!site) throw ApiError.notFound(SITE_NOT_FOUND);
  return toSiteDto(site);
}

/** The new site always belongs to the actor's company and gets the next free site code. */
export async function create(actor: TenantUserDto, input: CreateSiteInput): Promise<SiteDto> {
  const { startDate, ...fields } = input;
  await assertClientInCompany(actor.companyId, input.clientId);

  const site = await siteRepository.create({
    ...fields,
    code: await nextSiteCode(actor.companyId),
    ...(startDate !== undefined && { startDate: new Date(startDate) }),
    companyId: actor.companyId,
  });
  return toSiteDto(site);
}

/** Client payments recorded against the site must keep matching the site's client. */
async function assertNoReceiptsFromOtherClient(
  companyId: string,
  siteId: string,
  clientId: string,
): Promise<void> {
  if (await clientPaymentRepository.existsForSiteFromOtherClient(companyId, siteId, clientId)) {
    throw ApiError.conflict('Site has client payments from its current client; move them first', {
      fields: ['clientId'],
    });
  }
}

export async function update(
  actor: TenantUserDto,
  id: string,
  input: UpdateSiteInput,
): Promise<SiteDto> {
  const { startDate, ...fields } = input;
  if (input.clientId !== undefined) {
    await assertClientInCompany(actor.companyId, input.clientId);
    await assertNoReceiptsFromOtherClient(actor.companyId, id, input.clientId);
  }
  const updated = await siteRepository.updateInCompany(actor.companyId, id, {
    ...fields,
    ...(startDate !== undefined && { startDate: new Date(startDate) }),
  });
  if (!updated) throw ApiError.notFound(SITE_NOT_FOUND);
  return toSiteDto(updated);
}

/** Refused while work assignments, payments, expenses or client payments still reference the site. */
export async function remove(actor: TenantUserDto, id: string): Promise<void> {
  if (await workAssignmentRepository.existsForSite(actor.companyId, id)) {
    throw ApiError.conflict('Site still has work assignments; delete them first');
  }
  if (await paymentRepository.existsForSite(actor.companyId, id)) {
    throw ApiError.conflict('Site still has payments; delete or detach them first');
  }
  if (await expenseRepository.existsForSite(actor.companyId, id)) {
    throw ApiError.conflict('Site still has expenses; delete or move them first');
  }
  if (await clientPaymentRepository.existsForSite(actor.companyId, id)) {
    throw ApiError.conflict('Site still has client payments; delete or detach them first');
  }
  const deleted = await siteRepository.deleteInCompany(actor.companyId, id);
  if (!deleted) throw ApiError.notFound(SITE_NOT_FOUND);
}
