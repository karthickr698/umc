import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  type ExpenseDto,
  type Paginated,
  type TenantUserDto,
} from '@umc/shared';
import * as expenseRepository from '../repositories/expense.repository.js';
import type { ExpenseChanges, ExpenseRecord } from '../repositories/expense.repository.js';
import { ApiError } from '../utils/api-error.js';
import { fromCalendarDate, toCalendarDate } from '../utils/calendar-date.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type {
  CreateExpenseInput,
  ListExpensesInput,
  UpdateExpenseInput,
} from '../validators/expense.validator.js';
import {
  createAttachmentService,
  deleteStoredFiles,
  toAttachmentDtos,
} from './attachment.service.js';
import * as auditLogService from './audit-log.service.js';
import { changedFields, type AuditSnapshot } from './audit-log.service.js';
import { assertSiteInCompany } from './work-assignment.service.js';

const EXPENSE_NOT_FOUND = 'Expense not found';

export const attachments = createAttachmentService({
  folder: 'expenses',
  notFoundMessage: EXPENSE_NOT_FOUND,
  repository: expenseRepository.attachments,
});

export async function toExpenseDto(expense: ExpenseRecord): Promise<ExpenseDto> {
  return {
    id: expense._id.toString(),
    companyId: expense.companyId.toString(),
    siteId: expense.siteId.toString(),
    category: expense.category,
    ...(expense.vendorName !== undefined && { vendorName: expense.vendorName }),
    amount: expense.amount,
    expenseDate: toCalendarDate(expense.expenseDate),
    paymentMode: expense.paymentMode,
    ...(expense.description !== undefined && { description: expense.description }),
    attachments: await toAttachmentDtos(expense.attachments),
    createdBy: expense.createdBy.toString(),
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

function toAuditSnapshot(expense: ExpenseRecord): AuditSnapshot {
  return {
    siteId: expense.siteId.toString(),
    category: expense.category,
    vendorName: expense.vendorName,
    amount: expense.amount,
    expenseDate: toCalendarDate(expense.expenseDate),
    paymentMode: expense.paymentMode,
  };
}

/** Owning company of an expense, for `requireCompanyOwnership`; `null` when it does not exist. */
export function findCompanyId(id: string): Promise<string | null> {
  return expenseRepository.findCompanyIdById(id);
}

export async function list(
  actor: TenantUserDto,
  { page, pageSize, from, to, ...filter }: ListExpensesInput,
): Promise<Paginated<ExpenseDto>> {
  const { items, total } = await expenseRepository.listByCompany(
    actor.companyId,
    {
      ...filter,
      ...(from !== undefined && { from: fromCalendarDate(from) }),
      ...(to !== undefined && { to: fromCalendarDate(to) }),
    },
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(await Promise.all(items.map(toExpenseDto)), total, { page, pageSize });
}

export async function getById(actor: TenantUserDto, id: string): Promise<ExpenseDto> {
  const expense = await expenseRepository.findByIdInCompany(actor.companyId, id);
  if (!expense) throw ApiError.notFound(EXPENSE_NOT_FOUND);
  return toExpenseDto(expense);
}

/** The new expense always belongs to the actor's company, as must its site. */
export async function create(actor: TenantUserDto, input: CreateExpenseInput): Promise<ExpenseDto> {
  const { expenseDate, ...fields } = input;
  await assertSiteInCompany(actor.companyId, input.siteId);

  const expense = await expenseRepository.create({
    ...fields,
    expenseDate: fromCalendarDate(expenseDate),
    companyId: actor.companyId,
    createdBy: actor.id,
  });
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.CREATE,
    entity: AUDIT_ENTITIES.EXPENSE,
    entityId: expense._id.toString(),
    metadata: toAuditSnapshot(expense),
  });
  return toExpenseDto(expense);
}

export async function update(
  actor: TenantUserDto,
  id: string,
  input: UpdateExpenseInput,
): Promise<ExpenseDto> {
  const { companyId } = actor;
  const current = await expenseRepository.findByIdInCompany(companyId, id);
  if (!current) throw ApiError.notFound(EXPENSE_NOT_FOUND);

  const { expenseDate, ...fields } = input;
  const changes: ExpenseChanges = { ...fields };
  if (input.siteId !== undefined) await assertSiteInCompany(companyId, input.siteId);
  if (expenseDate !== undefined) changes.expenseDate = fromCalendarDate(expenseDate);

  const updated = await expenseRepository.updateInCompany(companyId, id, changes);
  if (!updated) throw ApiError.notFound(EXPENSE_NOT_FOUND);
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.EXPENSE,
    entityId: id,
    metadata: { changes: changedFields(toAuditSnapshot(current), toAuditSnapshot(updated)) },
  });
  return toExpenseDto(updated);
}

export async function remove(actor: TenantUserDto, id: string): Promise<void> {
  const { companyId } = actor;
  const expense = await expenseRepository.findByIdInCompany(companyId, id);
  if (!expense) throw ApiError.notFound(EXPENSE_NOT_FOUND);
  const deletedAttachments = await expenseRepository.deleteInCompany(companyId, id);
  if (!deletedAttachments) throw ApiError.notFound(EXPENSE_NOT_FOUND);
  await deleteStoredFiles(deletedAttachments);
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.DELETE,
    entity: AUDIT_ENTITIES.EXPENSE,
    entityId: id,
    metadata: toAuditSnapshot(expense),
  });
}
