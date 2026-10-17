import { Types, type PipelineStage } from 'mongoose';
import type { PaymentMode } from '@umc/shared';
import { ClientModel } from '../models/client.model.js';
import { ClientPaymentModel } from '../models/client-payment.model.js';
import { SiteModel } from '../models/site.model.js';
import { dateRangeCondition, nameLookup } from '../utils/aggregation.js';
import type { ClientPaymentFilter } from './client-payment.repository.js';

export interface ReceiptTotalsRow {
  totalAmount: number;
  paymentCount: number;
}

export interface ClientReceiptsRow extends ReceiptTotalsRow {
  clientId: Types.ObjectId;
  name?: string;
}

export interface SiteReceiptsRow extends ReceiptTotalsRow {
  /** `null` for receipts not tied to a site. */
  siteId: Types.ObjectId | null;
  name?: string;
  code?: string;
}

export interface PaymentModeReceiptsRow extends ReceiptTotalsRow {
  paymentMode: PaymentMode;
}

type FacetStage = PipelineStage.FacetPipelineStage;

// Aggregation bypasses Mongoose casting, so ids must be ObjectIds here.
function toMatch(companyId: string, filter: ClientPaymentFilter): Record<string, unknown> {
  const match: Record<string, unknown> = { companyId: new Types.ObjectId(companyId) };
  if (filter.clientId) match.clientId = new Types.ObjectId(filter.clientId);
  if (filter.siteId) match.siteId = new Types.ObjectId(filter.siteId);
  if (filter.paymentMode) match.paymentMode = filter.paymentMode;
  const receivedDate = dateRangeCondition(filter.from, filter.to);
  if (receivedDate) match.receivedDate = receivedDate;
  return match;
}

/**
 * Groups by `key` (copied into field `as`), rounds the sum to two decimals, and sorts highest
 * total first.
 */
function groupTotals(key: unknown, as?: string): FacetStage[] {
  return [
    { $group: { _id: key, total: { $sum: '$amount' }, paymentCount: { $sum: 1 } } },
    { $set: { totalAmount: { $round: ['$total', 2] }, ...(as && { [as]: '$_id' }) } },
    { $sort: { totalAmount: -1, _id: 1 } },
    { $unset: ['_id', 'total'] },
  ];
}

interface SummaryFacet {
  totals: ReceiptTotalsRow[];
  byClient: ClientReceiptsRow[];
  bySite: SiteReceiptsRow[];
  byPaymentMode: PaymentModeReceiptsRow[];
}

/** Totals over every matching receipt, plus per-client, per-site and per-mode breakdowns. */
export async function summarize(
  companyId: string,
  filter: ClientPaymentFilter,
): Promise<{
  totals: ReceiptTotalsRow | null;
  byClient: ClientReceiptsRow[];
  bySite: SiteReceiptsRow[];
  byPaymentMode: PaymentModeReceiptsRow[];
}> {
  const [result] = await ClientPaymentModel.aggregate<SummaryFacet>([
    { $match: toMatch(companyId, filter) },
    {
      $facet: {
        totals: groupTotals(null),
        byClient: [
          ...groupTotals('$clientId', 'clientId'),
          ...nameLookup(ClientModel.collection.name, 'clientId', { name: 1 }),
        ],
        bySite: [
          ...groupTotals({ $ifNull: ['$siteId', null] }, 'siteId'),
          ...nameLookup(SiteModel.collection.name, 'siteId', { name: 1, code: 1 }),
        ],
        byPaymentMode: groupTotals('$paymentMode', 'paymentMode'),
      },
    },
  ]).exec();

  return {
    totals: result?.totals[0] ?? null,
    byClient: result?.byClient ?? [],
    bySite: result?.bySite ?? [],
    byPaymentMode: result?.byPaymentMode ?? [],
  };
}
