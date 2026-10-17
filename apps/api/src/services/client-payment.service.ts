import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  type ClientPaymentDto,
  type ClientPaymentFilterQuery,
  type Paginated,
  type TenantUserDto,
} from '@umc/shared';
import * as clientPaymentRepository from '../repositories/client-payment.repository.js';
import type {
  ClientPaymentChanges,
  ClientPaymentFilter,
  ClientPaymentRecord,
} from '../repositories/client-payment.repository.js';
import { ApiError } from '../utils/api-error.js';
import { fromCalendarDate, toCalendarDate } from '../utils/calendar-date.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type {
  CreateClientPaymentInput,
  ListClientPaymentsInput,
  UpdateClientPaymentInput,
} from '../validators/client-payment.validator.js';
import {
  createAttachmentService,
  deleteStoredFiles,
  toAttachmentDtos,
} from './attachment.service.js';
import * as auditLogService from './audit-log.service.js';
import { changedFields, type AuditSnapshot } from './audit-log.service.js';
import { assertClientInCompany } from './client.service.js';
import { assertSiteOfClient } from './site.service.js';

const CLIENT_PAYMENT_NOT_FOUND = 'Client payment not found';

export const attachments = createAttachmentService({
  folder: 'client-payments',
  notFoundMessage: CLIENT_PAYMENT_NOT_FOUND,
  repository: clientPaymentRepository.attachments,
});

export async function toClientPaymentDto(payment: ClientPaymentRecord): Promise<ClientPaymentDto> {
  return {
    id: payment._id.toString(),
    companyId: payment.companyId.toString(),
    clientId: payment.clientId.toString(),
    ...(payment.siteId && { siteId: payment.siteId.toString() }),
    amount: payment.amount,
    receivedDate: toCalendarDate(payment.receivedDate),
    paymentMode: payment.paymentMode,
    ...(payment.referenceNumber !== undefined && { referenceNumber: payment.referenceNumber }),
    ...(payment.description !== undefined && { description: payment.description }),
    attachments: await toAttachmentDtos(payment.attachments),
    createdBy: payment.createdBy.toString(),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

function toAuditSnapshot(payment: ClientPaymentRecord): AuditSnapshot {
  return {
    clientId: payment.clientId.toString(),
    siteId: payment.siteId?.toString(),
    amount: payment.amount,
    receivedDate: toCalendarDate(payment.receivedDate),
    paymentMode: payment.paymentMode,
    referenceNumber: payment.referenceNumber,
  };
}

/** Converts the calendar-day range of a list or summary query to stored dates. */
export function toClientPaymentFilter({
  from,
  to,
  ...filter
}: ClientPaymentFilterQuery): ClientPaymentFilter {
  return {
    ...filter,
    ...(from !== undefined && { from: fromCalendarDate(from) }),
    ...(to !== undefined && { to: fromCalendarDate(to) }),
  };
}

/** Owning company of a receipt, for `requireCompanyOwnership`; `null` when it does not exist. */
export function findCompanyId(id: string): Promise<string | null> {
  return clientPaymentRepository.findCompanyIdById(id);
}

export async function list(
  actor: TenantUserDto,
  { page, pageSize, ...query }: ListClientPaymentsInput,
): Promise<Paginated<ClientPaymentDto>> {
  const { items, total } = await clientPaymentRepository.listByCompany(
    actor.companyId,
    toClientPaymentFilter(query),
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(await Promise.all(items.map(toClientPaymentDto)), total, { page, pageSize });
}

export async function getById(actor: TenantUserDto, id: string): Promise<ClientPaymentDto> {
  const payment = await clientPaymentRepository.findByIdInCompany(actor.companyId, id);
  if (!payment) throw ApiError.notFound(CLIENT_PAYMENT_NOT_FOUND);
  return toClientPaymentDto(payment);
}

/** The new receipt always belongs to the actor's company, as must its client and site. */
export async function create(
  actor: TenantUserDto,
  input: CreateClientPaymentInput,
): Promise<ClientPaymentDto> {
  const { companyId } = actor;
  const { receivedDate, ...fields } = input;
  await assertClientInCompany(companyId, input.clientId);
  if (input.siteId !== undefined) await assertSiteOfClient(companyId, input.siteId, input.clientId);

  const payment = await clientPaymentRepository.create({
    ...fields,
    receivedDate: fromCalendarDate(receivedDate),
    companyId,
    createdBy: actor.id,
  });
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.CREATE,
    entity: AUDIT_ENTITIES.CLIENT_PAYMENT,
    entityId: payment._id.toString(),
    metadata: toAuditSnapshot(payment),
  });
  return toClientPaymentDto(payment);
}

/**
 * The site/client relationship is re-checked only when the client or site changes, so editing
 * other fields keeps working after a site is reassigned.
 */
export async function update(
  actor: TenantUserDto,
  id: string,
  input: UpdateClientPaymentInput,
): Promise<ClientPaymentDto> {
  const { companyId } = actor;
  const current = await clientPaymentRepository.findByIdInCompany(companyId, id);
  if (!current) throw ApiError.notFound(CLIENT_PAYMENT_NOT_FOUND);

  const { receivedDate, ...fields } = input;
  const changes: ClientPaymentChanges = { ...fields };
  if (receivedDate !== undefined) changes.receivedDate = fromCalendarDate(receivedDate);
  if (input.clientId !== undefined) await assertClientInCompany(companyId, input.clientId);

  const clientId = input.clientId ?? current.clientId.toString();
  const siteId = input.siteId === undefined ? current.siteId?.toString() : input.siteId;
  if (siteId && (input.clientId !== undefined || input.siteId !== undefined)) {
    await assertSiteOfClient(companyId, siteId, clientId);
  }

  const updated = await clientPaymentRepository.updateInCompany(companyId, id, changes);
  if (!updated) throw ApiError.notFound(CLIENT_PAYMENT_NOT_FOUND);
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.CLIENT_PAYMENT,
    entityId: id,
    metadata: { changes: changedFields(toAuditSnapshot(current), toAuditSnapshot(updated)) },
  });
  return toClientPaymentDto(updated);
}

export async function remove(actor: TenantUserDto, id: string): Promise<void> {
  const { companyId } = actor;
  const payment = await clientPaymentRepository.findByIdInCompany(companyId, id);
  if (!payment) throw ApiError.notFound(CLIENT_PAYMENT_NOT_FOUND);
  const deletedAttachments = await clientPaymentRepository.deleteInCompany(companyId, id);
  if (!deletedAttachments) throw ApiError.notFound(CLIENT_PAYMENT_NOT_FOUND);
  await deleteStoredFiles(deletedAttachments);
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.DELETE,
    entity: AUDIT_ENTITIES.CLIENT_PAYMENT,
    entityId: id,
    metadata: toAuditSnapshot(payment),
  });
}
