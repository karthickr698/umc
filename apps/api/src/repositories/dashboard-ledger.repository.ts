import type { PipelineStage } from 'mongoose';
import { TRANSACTION_KINDS, WORKER_TYPES } from '@umc/shared';
import { ExpenseModel } from '../models/expense.model.js';
import { PaymentModel } from '../models/payment.model.js';
import { dateRangeCondition, toObjectId } from '../utils/aggregation.js';

export interface DashboardFilter {
  siteId?: string;
  /** Client payments are matched on this directly. */
  clientId?: string;
  /** Worker payments and expenses carry no client, so a client filter matches them by site. */
  clientSiteIds?: string[];
  /** Narrows payments to own employees only. */
  employeeId?: string;
  /** Narrows payments to contractor employees only. */
  contractorId?: string;
  /** Inclusive range of stored calendar days. */
  from?: Date;
  to?: Date;
}

export interface LedgerOptions {
  /** Also keep what a transaction list needs: ids, mode, type or category, description. */
  details?: boolean;
  /** Keep only the expense category, as `expenseCategory`; implied by `details`. */
  expenseCategory?: boolean;
  /**
   * Keep only each collection's newest `latest` entries (by date, then `createdAt`, then id), so
   * a "latest N" list reads N index entries per collection instead of every match.
   */
  latest?: number;
}

type Match = Record<string, unknown>;
type Stage = PipelineStage.FacetPipelineStage;

/** The collection's `$match`, narrowed to its newest entries when `latest` is set. */
function filterStages(match: Match, dateField: string, { latest }: LedgerOptions): Stage[] {
  if (latest === undefined) return [{ $match: match }];
  return [
    { $match: match },
    { $sort: { [dateField]: -1, createdAt: -1, _id: -1 } },
    { $limit: latest },
  ];
}

function baseMatch(companyId: string, filter: DashboardFilter, dateField: string): Match {
  const match: Match = { companyId: toObjectId(companyId) };
  const dateRange = dateRangeCondition(filter.from, filter.to);
  if (dateRange) match[dateField] = dateRange;
  return match;
}

/** Site condition for collections that carry no client of their own. */
function siteScope(filter: DashboardFilter): Match {
  if (filter.siteId) return { siteId: toObjectId(filter.siteId) };
  if (filter.clientSiteIds) return { siteId: { $in: filter.clientSiteIds.map(toObjectId) } };
  return {};
}

function receiptMatch(companyId: string, filter: DashboardFilter): Match {
  return {
    ...baseMatch(companyId, filter, 'receivedDate'),
    ...(filter.siteId && { siteId: toObjectId(filter.siteId) }),
    ...(filter.clientId && { clientId: toObjectId(filter.clientId) }),
  };
}

/** The employee filter only narrows own-employee payments, the contractor filter only the rest. */
function paymentMatch(companyId: string, filter: DashboardFilter): Match {
  const match: Match = { ...baseMatch(companyId, filter, 'paymentDate'), ...siteScope(filter) };
  if (filter.employeeId || filter.contractorId) {
    match.$or = [
      {
        workerType: WORKER_TYPES.EMPLOYEE,
        ...(filter.employeeId && { employeeId: toObjectId(filter.employeeId) }),
      },
      {
        workerType: WORKER_TYPES.CONTRACTOR_EMPLOYEE,
        ...(filter.contractorId && { contractorId: toObjectId(filter.contractorId) }),
      },
    ];
  }
  return match;
}

function expenseMatch(companyId: string, filter: DashboardFilter): Match {
  return { ...baseMatch(companyId, filter, 'expenseDate'), ...siteScope(filter) };
}

const siteIdExpr = { $ifNull: ['$siteId', null] };

/** Projection shared by every collection; `details` adds the transaction-list fields. */
function commonFields(dateField: string, { details }: LedgerOptions, extra: Match): Match {
  return {
    _id: 0,
    date: `$${dateField}`,
    amount: 1,
    ...(details && { id: '$_id', createdAt: 1, paymentMode: 1, description: 1, ...extra }),
  };
}

/**
 * Merges receipts, worker payments and expenses into one stream of `{ kind, siteId, date, amount }`
 * entries (payments also keep their worker identity). Each collection is filtered by its own
 * index-backed `$match` before the merge.
 */
export function ledgerStages(
  companyId: string,
  filter: DashboardFilter,
  options: LedgerOptions = {},
): PipelineStage[] {
  return [
    ...filterStages(receiptMatch(companyId, filter), 'receivedDate', options),
    {
      $project: {
        ...commonFields('receivedDate', options, { clientId: 1 }),
        kind: { $literal: TRANSACTION_KINDS.CLIENT_PAYMENT },
        siteId: siteIdExpr,
      },
    },
    {
      $unionWith: {
        coll: PaymentModel.collection.name,
        pipeline: [
          ...filterStages(paymentMatch(companyId, filter), 'paymentDate', options),
          {
            $project: {
              ...commonFields('paymentDate', options, { paymentType: 1 }),
              kind: {
                $cond: [
                  { $eq: ['$workerType', WORKER_TYPES.EMPLOYEE] },
                  TRANSACTION_KINDS.WORKER_PAYMENT,
                  TRANSACTION_KINDS.CONTRACTOR_PAYMENT,
                ],
              },
              siteId: siteIdExpr,
              employeeId: 1,
              contractorId: 1,
            },
          },
        ],
      },
    },
    {
      $unionWith: {
        coll: ExpenseModel.collection.name,
        pipeline: [
          ...filterStages(expenseMatch(companyId, filter), 'expenseDate', options),
          {
            $project: {
              ...commonFields('expenseDate', options, {
                expenseCategory: '$category',
                vendorName: 1,
              }),
              kind: { $literal: TRANSACTION_KINDS.EXPENSE },
              siteId: 1,
              ...(options.expenseCategory && { expenseCategory: '$category' }),
            },
          },
        ],
      },
    },
  ];
}
