import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  type Paginated,
  type PaymentDto,
  type TenantUserDto,
} from '@umc/shared';
import { logger } from '../config/logger.js';
import * as invoiceRepository from '../repositories/invoice.repository.js';
import * as paymentRepository from '../repositories/payment.repository.js';
import type {
  PaymentChanges,
  PaymentFilter,
  PaymentRecord,
} from '../repositories/payment.repository.js';
import * as workAssignmentRepository from '../repositories/work-assignment.repository.js';
import { ApiError } from '../utils/api-error.js';
import { fromCalendarDate, toCalendarDate } from '../utils/calendar-date.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type { WorkerRef } from '../utils/worker-ref.js';
import type {
  CreatePaymentInput,
  ListPaymentsInput,
  UpdatePaymentInput,
} from '../validators/payment.validator.js';
import {
  createAttachmentService,
  deleteStoredFiles,
  toAttachmentDtos,
} from './attachment.service.js';
import * as auditLogService from './audit-log.service.js';
import { changedFields, type AuditSnapshot } from './audit-log.service.js';
import * as invoiceService from './invoice.service.js';
import { assertSiteInCompany } from './work-assignment.service.js';
import { resolveReplacementWorker, resolveWorker, workerRefOf } from './worker.service.js';

const PAYMENT_NOT_FOUND = 'Payment not found';

export const attachments = createAttachmentService({
  folder: 'payments',
  notFoundMessage: PAYMENT_NOT_FOUND,
  repository: paymentRepository.attachments,
});

export async function toPaymentDto(payment: PaymentRecord): Promise<PaymentDto> {
  return {
    id: payment._id.toString(),
    companyId: payment.companyId.toString(),
    ...(payment.siteId && { siteId: payment.siteId.toString() }),
    workerType: payment.workerType,
    ...(payment.employeeId && { employeeId: payment.employeeId.toString() }),
    ...(payment.contractorId && { contractorId: payment.contractorId.toString() }),
    ...(payment.contractorEmployeeId && {
      contractorEmployeeId: payment.contractorEmployeeId.toString(),
    }),
    amount: payment.amount,
    paymentDate: toCalendarDate(payment.paymentDate),
    paymentType: payment.paymentType,
    paymentMode: payment.paymentMode,
    ...(payment.referenceNumber !== undefined && { referenceNumber: payment.referenceNumber }),
    ...(payment.description !== undefined && { description: payment.description }),
    attachments: await toAttachmentDtos(payment.attachments),
    createdBy: payment.createdBy.toString(),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

function toAuditSnapshot(payment: PaymentRecord): AuditSnapshot {
  return {
    siteId: payment.siteId?.toString(),
    workerType: payment.workerType,
    employeeId: payment.employeeId?.toString(),
    contractorId: payment.contractorId?.toString(),
    contractorEmployeeId: payment.contractorEmployeeId?.toString(),
    amount: payment.amount,
    paymentDate: toCalendarDate(payment.paymentDate),
    paymentType: payment.paymentType,
    paymentMode: payment.paymentMode,
    referenceNumber: payment.referenceNumber,
  };
}

/** Owning company of a payment, for `requireCompanyOwnership`; `null` when it does not exist. */
export function findCompanyId(id: string): Promise<string | null> {
  return paymentRepository.findCompanyIdById(id);
}

/** A worker may only be paid against a site they hold a SCHEDULED or COMPLETED assignment at. */
async function assertWorkerAtSite(
  companyId: string,
  worker: WorkerRef,
  siteId: string,
): Promise<void> {
  if (!(await workAssignmentRepository.existsActiveForWorkerAtSite(companyId, worker, siteId))) {
    throw ApiError.validation([
      { path: 'siteId', message: 'Worker has no work assignment at this site' },
    ]);
  }
}

export function toPaymentFilter({
  from,
  to,
  ...filter
}: Omit<ListPaymentsInput, 'page' | 'pageSize'>): PaymentFilter {
  return {
    ...filter,
    ...(from !== undefined && { from: fromCalendarDate(from) }),
    ...(to !== undefined && { to: fromCalendarDate(to) }),
  };
}

export async function list(
  actor: TenantUserDto,
  { page, pageSize, ...filter }: ListPaymentsInput,
): Promise<Paginated<PaymentDto>> {
  const { items, total } = await paymentRepository.listByCompany(
    actor.companyId,
    toPaymentFilter(filter),
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(await Promise.all(items.map(toPaymentDto)), total, { page, pageSize });
}

export async function getById(actor: TenantUserDto, id: string): Promise<PaymentDto> {
  const payment = await paymentRepository.findByIdInCompany(actor.companyId, id);
  if (!payment) throw ApiError.notFound(PAYMENT_NOT_FOUND);
  return toPaymentDto(payment);
}

/**
 * A failed invoice must not undo the payment it documents: it is logged and can be retried by
 * creating or regenerating the invoice.
 */
async function issueInvoice(actor: TenantUserDto, paymentId: string): Promise<void> {
  try {
    await invoiceService.create(actor, { paymentId });
  } catch (err) {
    logger.warn({ err, paymentId }, 'Automatic invoice generation failed');
  }
}

/**
 * The new payment always belongs to the actor's company, as must every record it references.
 * Its invoice is issued right away.
 */
export async function create(actor: TenantUserDto, input: CreatePaymentInput): Promise<PaymentDto> {
  const { companyId } = actor;
  const worker = await resolveWorker(companyId, input);
  if (input.siteId !== undefined) {
    await assertSiteInCompany(companyId, input.siteId);
    await assertWorkerAtSite(companyId, worker.ref, input.siteId);
  }

  const payment = await paymentRepository.create({
    companyId,
    ...(input.siteId !== undefined && { siteId: input.siteId }),
    workerType: input.workerType,
    ...worker.fields,
    amount: input.amount,
    paymentDate: fromCalendarDate(input.paymentDate),
    paymentType: input.paymentType,
    paymentMode: input.paymentMode,
    ...(input.referenceNumber !== undefined && { referenceNumber: input.referenceNumber }),
    ...(input.description !== undefined && { description: input.description }),
    createdBy: actor.id,
  });
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.CREATE,
    entity: AUDIT_ENTITIES.PAYMENT,
    entityId: payment._id.toString(),
    metadata: toAuditSnapshot(payment),
  });
  await issueInvoice(actor, payment._id.toString());
  return toPaymentDto(payment);
}

/**
 * The worker/site relationship is re-checked only when the worker or site changes, so editing
 * other fields keeps working after the underlying assignments change.
 */
export async function update(
  actor: TenantUserDto,
  id: string,
  input: UpdatePaymentInput,
): Promise<PaymentDto> {
  const { companyId } = actor;
  const current = await paymentRepository.findByIdInCompany(companyId, id);
  if (!current) throw ApiError.notFound(PAYMENT_NOT_FOUND);

  const { employeeId, contractorEmployeeId, paymentDate, ...fields } = input;
  const changes: PaymentChanges = { ...fields };

  const replacement = await resolveReplacementWorker(companyId, current.workerType, {
    employeeId,
    contractorEmployeeId,
  });
  if (replacement) Object.assign(changes, replacement.fields);
  if (typeof input.siteId === 'string') await assertSiteInCompany(companyId, input.siteId);
  if (paymentDate !== undefined) changes.paymentDate = fromCalendarDate(paymentDate);

  const siteId = input.siteId === undefined ? current.siteId?.toString() : input.siteId;
  if (siteId && (replacement || input.siteId !== undefined)) {
    await assertWorkerAtSite(companyId, replacement?.ref ?? workerRefOf(current), siteId);
  }

  const updated = await paymentRepository.updateInCompany(companyId, id, changes);
  if (!updated) throw ApiError.notFound(PAYMENT_NOT_FOUND);
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.PAYMENT,
    entityId: id,
    metadata: { changes: changedFields(toAuditSnapshot(current), toAuditSnapshot(updated)) },
  });
  return toPaymentDto(updated);
}

/** Also deletes the payment's invoice and its PDF, which document a payment that is gone. */
export async function remove(actor: TenantUserDto, id: string): Promise<void> {
  const { companyId } = actor;
  const payment = await paymentRepository.findByIdInCompany(companyId, id);
  if (!payment) throw ApiError.notFound(PAYMENT_NOT_FOUND);
  const deletedAttachments = await paymentRepository.deleteInCompany(companyId, id);
  if (!deletedAttachments) throw ApiError.notFound(PAYMENT_NOT_FOUND);
  const invoicePdfKeys = await invoiceRepository.deleteByPayment(companyId, id);
  await deleteStoredFiles([...deletedAttachments, ...invoicePdfKeys.map((key) => ({ key }))]);
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.DELETE,
    entity: AUDIT_ENTITIES.PAYMENT,
    entityId: id,
    metadata: toAuditSnapshot(payment),
  });
}
