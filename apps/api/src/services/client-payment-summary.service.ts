import type { ClientPaymentSummaryDto, ClientReceiptTotals, TenantUserDto } from '@umc/shared';
import * as clientPaymentSummaryRepository from '../repositories/client-payment-summary.repository.js';
import type { ReceiptTotalsRow } from '../repositories/client-payment-summary.repository.js';
import { omitUndefined } from '../utils/object.js';
import type { ClientPaymentSummaryInput } from '../validators/client-payment.validator.js';
import { toClientPaymentFilter } from './client-payment.service.js';

function toTotals(row: ReceiptTotalsRow | null): ClientReceiptTotals {
  return { totalAmount: row?.totalAmount ?? 0, paymentCount: row?.paymentCount ?? 0 };
}

/** Total client receipts matching the filters, broken down by client, site and payment mode. */
export async function summarize(
  actor: TenantUserDto,
  query: ClientPaymentSummaryInput,
): Promise<ClientPaymentSummaryDto> {
  const { totals, byClient, bySite, byPaymentMode } =
    await clientPaymentSummaryRepository.summarize(actor.companyId, toClientPaymentFilter(query));

  return {
    filters: omitUndefined(query),
    totals: toTotals(totals),
    byClient: byClient.map((row) => ({
      clientId: row.clientId.toString(),
      ...(row.name !== undefined && { clientName: row.name }),
      ...toTotals(row),
    })),
    bySite: bySite.map((row) => ({
      siteId: row.siteId ? row.siteId.toString() : null,
      ...(row.name !== undefined && { siteName: row.name }),
      ...(row.code !== undefined && { siteCode: row.code }),
      ...toTotals(row),
    })),
    byPaymentMode: byPaymentMode.map((row) => ({
      paymentMode: row.paymentMode,
      ...toTotals(row),
    })),
  };
}
