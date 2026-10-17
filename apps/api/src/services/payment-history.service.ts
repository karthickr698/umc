import type { Paginated, PaymentHistoryItemDto, TenantUserDto } from '@umc/shared';
import * as paymentHistoryRepository from '../repositories/payment-history.repository.js';
import type { PaymentHistoryRow } from '../repositories/payment-history.repository.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type { PaymentHistoryInput } from '../validators/payment.validator.js';
import { toInvoiceDto } from './invoice.service.js';
import { toPaymentDto, toPaymentFilter } from './payment.service.js';

async function toPaymentHistoryItemDto(row: PaymentHistoryRow): Promise<PaymentHistoryItemDto> {
  const { siteName, siteCode, workerName, workerCode, contractorName, invoice } = row;
  return {
    ...(await toPaymentDto(row)),
    ...(siteName && { siteName }),
    ...(siteCode && { siteCode }),
    ...(workerName && { workerName }),
    ...(workerCode && { workerCode }),
    ...(contractorName && { contractorName }),
    ...(invoice && { invoice: toInvoiceDto(invoice) }),
  };
}

export async function listHistory(
  actor: TenantUserDto,
  { page, pageSize, ...filter }: PaymentHistoryInput,
): Promise<Paginated<PaymentHistoryItemDto>> {
  const { items, total } = await paymentHistoryRepository.listHistoryByCompany(
    actor.companyId,
    toPaymentFilter(filter),
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(await Promise.all(items.map(toPaymentHistoryItemDto)), total, {
    page,
    pageSize,
  });
}
