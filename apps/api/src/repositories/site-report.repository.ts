import type { PipelineStage, Types } from 'mongoose';
import { EXPENSE_CATEGORIES, TRANSACTION_KINDS, type TransactionKind } from '@umc/shared';
import { ClientPaymentModel } from '../models/client-payment.model.js';
import { SiteModel } from '../models/site.model.js';
import { nameLookup } from '../utils/aggregation.js';
import { ledgerStages, type DashboardFilter } from './dashboard-ledger.repository.js';

export type SiteReportFilter = Pick<DashboardFilter, 'siteId' | 'from' | 'to'>;

export interface SiteReportTotalsRow {
  clientReceipts: number;
  employeePayments: number;
  contractorPayments: number;
  materialExpenses: number;
  otherExpenses: number;
  totalExpenses: number;
  balance: number;
}

export interface SiteReportRow extends SiteReportTotalsRow {
  /** `null` for records not tied to a site. */
  siteId: Types.ObjectId | null;
  name?: string;
  code?: string;
}

type FacetStage = PipelineStage.FacetPipelineStage;

const isKind = (kind: TransactionKind) => ({ $eq: ['$kind', kind] });
const isMaterial = { $eq: ['$expenseCategory', EXPENSE_CATEGORIES.MATERIAL] };
const sumIf = (condition: unknown) => ({ $sum: { $cond: [condition, '$amount', 0] } });

const sumReport = {
  received: sumIf(isKind(TRANSACTION_KINDS.CLIENT_PAYMENT)),
  employeePaid: sumIf(isKind(TRANSACTION_KINDS.WORKER_PAYMENT)),
  contractorPaid: sumIf(isKind(TRANSACTION_KINDS.CONTRACTOR_PAYMENT)),
  material: sumIf({ $and: [isKind(TRANSACTION_KINDS.EXPENSE), isMaterial] }),
  other: sumIf({ $and: [isKind(TRANSACTION_KINDS.EXPENSE), { $not: [isMaterial] }] }),
};

const spentExpr = { $add: ['$employeePaid', '$contractorPaid', '$material', '$other'] };

/** Replaces the raw `sumReport` sums with amounts rounded to two decimals. */
const roundStages: FacetStage[] = [
  {
    $set: {
      clientReceipts: { $round: ['$received', 2] },
      employeePayments: { $round: ['$employeePaid', 2] },
      contractorPayments: { $round: ['$contractorPaid', 2] },
      materialExpenses: { $round: ['$material', 2] },
      otherExpenses: { $round: ['$other', 2] },
      totalExpenses: { $round: [spentExpr, 2] },
      balance: { $round: [{ $subtract: ['$received', spentExpr] }, 2] },
    },
  },
  { $unset: Object.keys(sumReport) },
];

interface SiteReportFacet {
  totals: SiteReportTotalsRow[];
  sites: SiteReportRow[];
}

/**
 * Receipts, payments and expenses per site plus overall totals, in one round trip. Sites are
 * sorted by name; the row for records not tied to a site comes last.
 */
export async function summarizeBySite(
  companyId: string,
  filter: SiteReportFilter,
): Promise<{ totals: SiteReportTotalsRow | null; sites: SiteReportRow[] }> {
  const [result] = await ClientPaymentModel.aggregate<SiteReportFacet>([
    ...ledgerStages(companyId, filter, { expenseCategory: true }),
    {
      $facet: {
        totals: [{ $group: { _id: null, ...sumReport } }, ...roundStages, { $unset: '_id' }],
        sites: [
          { $group: { _id: '$siteId', ...sumReport } },
          ...roundStages,
          { $set: { siteId: '$_id' } },
          { $unset: '_id' },
          ...nameLookup(SiteModel.collection.name, 'siteId', { name: 1, code: 1 }),
          { $set: { unassigned: { $eq: ['$siteId', null] } } },
          { $sort: { unassigned: 1, name: 1, siteId: 1 } },
          { $unset: 'unassigned' },
        ],
      },
    },
  ]).exec();

  return { totals: result?.totals[0] ?? null, sites: result?.sites ?? [] };
}
