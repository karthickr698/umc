import type { PipelineStage, Types } from 'mongoose';
import {
  TRANSACTION_KINDS,
  TREND_INTERVALS,
  type TransactionKind,
  type TrendInterval,
} from '@umc/shared';
import { ClientPaymentModel } from '../models/client-payment.model.js';
import { ContractorModel } from '../models/contractor.model.js';
import { EmployeeModel } from '../models/employee.model.js';
import { SiteModel } from '../models/site.model.js';
import { nameLookup } from '../utils/aggregation.js';
import { ledgerStages, type DashboardFilter } from './dashboard-ledger.repository.js';

export interface DashboardTotalsRow {
  clientPaymentsReceived: number;
  workerPayments: number;
  contractorPayments: number;
  expenses: number;
  balance: number;
}

export interface SiteTotalsRow extends DashboardTotalsRow {
  /** `null` for records not tied to a site. */
  siteId: Types.ObjectId | null;
  name?: string;
  code?: string;
}

export interface PaymentTotalsRow {
  totalAmount: number;
  paymentCount: number;
}

export interface WorkerTotalsRow extends PaymentTotalsRow {
  employeeId: Types.ObjectId;
  name?: string;
  employeeCode?: string;
}

export interface ContractorTotalsRow extends PaymentTotalsRow {
  contractorId: Types.ObjectId;
  name?: string;
}

export interface TrendPointRow extends DashboardTotalsRow {
  period: string;
}

type FacetStage = PipelineStage.FacetPipelineStage;

function sumOf(kind: TransactionKind): { $sum: unknown } {
  return { $sum: { $cond: [{ $eq: ['$kind', kind] }, '$amount', 0] } };
}

/** `$group` accumulators of the four ledger totals. */
const sumLedger = {
  received: sumOf(TRANSACTION_KINDS.CLIENT_PAYMENT),
  workerPaid: sumOf(TRANSACTION_KINDS.WORKER_PAYMENT),
  contractorPaid: sumOf(TRANSACTION_KINDS.CONTRACTOR_PAYMENT),
  spent: sumOf(TRANSACTION_KINDS.EXPENSE),
};

/** Replaces the raw `sumLedger` sums with amounts rounded to two decimals, plus the balance. */
const roundTotalsStages: FacetStage[] = [
  {
    $set: {
      clientPaymentsReceived: { $round: ['$received', 2] },
      workerPayments: { $round: ['$workerPaid', 2] },
      contractorPayments: { $round: ['$contractorPaid', 2] },
      expenses: { $round: ['$spent', 2] },
      balance: {
        $round: [
          { $subtract: ['$received', { $add: ['$workerPaid', '$contractorPaid', '$spent'] }] },
          2,
        ],
      },
    },
  },
  { $unset: Object.keys(sumLedger) },
];

/** Payments of one kind grouped by the id in field `idField`, highest total first. */
function paymentTotalsStages(kind: TransactionKind, idField: string): FacetStage[] {
  return [
    { $match: { kind } },
    { $group: { _id: `$${idField}`, total: { $sum: '$amount' }, paymentCount: { $sum: 1 } } },
    { $set: { totalAmount: { $round: ['$total', 2] }, [idField]: '$_id' } },
    { $sort: { totalAmount: -1, _id: 1 } },
    { $unset: ['_id', 'total'] },
  ];
}

const PERIOD_FORMATS: Readonly<Record<TrendInterval, string>> = {
  [TREND_INTERVALS.DAY]: '%Y-%m-%d',
  [TREND_INTERVALS.MONTH]: '%Y-%m',
};

/** Ledger totals per day or month, oldest first; periods without records are left out. */
function trendStages(interval: TrendInterval): FacetStage[] {
  return [
    {
      $group: {
        // Calendar days are stored at UTC midnight.
        _id: {
          $dateToString: { format: PERIOD_FORMATS[interval], date: '$date', timezone: 'UTC' },
        },
        ...sumLedger,
      },
    },
    ...roundTotalsStages,
    { $sort: { _id: 1 } },
    { $set: { period: '$_id' } },
    { $unset: '_id' },
  ];
}

interface DashboardFacet {
  totals: DashboardTotalsRow[];
  bySite: SiteTotalsRow[];
  byWorker: WorkerTotalsRow[];
  byContractor: ContractorTotalsRow[];
  trend?: TrendPointRow[];
}

/**
 * Overall totals plus per-site, per-employee and per-contractor breakdowns and, with
 * `trendInterval`, the trend over time, all from a single pass over the ledger.
 */
export async function summarize(
  companyId: string,
  filter: DashboardFilter,
  trendInterval?: TrendInterval,
): Promise<{
  totals: DashboardTotalsRow | null;
  bySite: SiteTotalsRow[];
  byWorker: WorkerTotalsRow[];
  byContractor: ContractorTotalsRow[];
  trend: TrendPointRow[];
}> {
  const [result] = await ClientPaymentModel.aggregate<DashboardFacet>([
    ...ledgerStages(companyId, filter),
    {
      $facet: {
        totals: [{ $group: { _id: null, ...sumLedger } }, ...roundTotalsStages, { $unset: '_id' }],
        bySite: [
          { $group: { _id: '$siteId', ...sumLedger } },
          ...roundTotalsStages,
          { $sort: { clientPaymentsReceived: -1, _id: 1 } },
          { $set: { siteId: '$_id' } },
          { $unset: '_id' },
          ...nameLookup(SiteModel.collection.name, 'siteId', { name: 1, code: 1 }),
        ],
        byWorker: [
          ...paymentTotalsStages(TRANSACTION_KINDS.WORKER_PAYMENT, 'employeeId'),
          ...nameLookup(EmployeeModel.collection.name, 'employeeId', {
            name: 1,
            employeeCode: 1,
          }),
        ],
        byContractor: [
          ...paymentTotalsStages(TRANSACTION_KINDS.CONTRACTOR_PAYMENT, 'contractorId'),
          ...nameLookup(ContractorModel.collection.name, 'contractorId', { name: 1 }),
        ],
        ...(trendInterval && { trend: trendStages(trendInterval) }),
      },
    },
  ]).exec();

  return {
    totals: result?.totals[0] ?? null,
    bySite: result?.bySite ?? [],
    byWorker: result?.byWorker ?? [],
    byContractor: result?.byContractor ?? [],
    trend: result?.trend ?? [],
  };
}
