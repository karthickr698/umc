import { Types, type PipelineStage } from 'mongoose';
import { ACTIVE_WORK_ASSIGNMENT_STATUSES, WORKER_TYPES, type WorkerType } from '@umc/shared';
import { ContractorEmployeeModel } from '../models/contractor-employee.model.js';
import { ContractorModel } from '../models/contractor.model.js';
import { EmployeeModel } from '../models/employee.model.js';
import { PaymentModel } from '../models/payment.model.js';
import { SiteModel } from '../models/site.model.js';
import { WorkAssignmentModel } from '../models/work-assignment.model.js';
import { dateRangeCondition, nameLookup } from '../utils/aggregation.js';
import type { SkipLimit } from '../utils/pagination.js';
import { workerIdField, type WorkerRef } from '../utils/worker-ref.js';

export interface WorkerSummaryFilter {
  siteId?: string;
  workerType?: WorkerType;
  /** Restricts the summary to one worker; takes precedence over `workerType`. */
  worker?: WorkerRef;
  /** Restricts the summary to this contractor's workers, which leaves out own employees. */
  contractorId?: string;
  /** Inclusive range of stored calendar days. */
  from?: Date;
  to?: Date;
}

export interface FinancialTotalsRow {
  assignedDays: number;
  earnedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface WorkerTotalsRow extends FinancialTotalsRow {
  workerType: WorkerType;
  workerId: Types.ObjectId;
  contractorId?: Types.ObjectId;
  contractorName?: string;
  name?: string;
  employeeCode?: string;
}

export interface SiteTotalsRow extends FinancialTotalsRow {
  /** `null` for payments not tied to a site. */
  siteId: Types.ObjectId | null;
  name?: string;
  code?: string;
}

type Match = Record<string, unknown>;
type FacetStage = PipelineStage.FacetPipelineStage;

// Aggregation bypasses Mongoose casting, so ids must be ObjectIds here.
function toMatch(
  companyId: string,
  filter: WorkerSummaryFilter,
  dateField: 'date' | 'paymentDate',
): Match {
  const match: Match = { companyId: new Types.ObjectId(companyId) };
  if (filter.siteId) match.siteId = new Types.ObjectId(filter.siteId);
  if (filter.worker) {
    match.workerType = filter.worker.workerType;
    match[workerIdField(filter.worker.workerType)] = new Types.ObjectId(filter.worker.workerId);
  } else if (filter.workerType) {
    match.workerType = filter.workerType;
  }
  if (filter.contractorId) match.contractorId = new Types.ObjectId(filter.contractorId);
  const dateRange = dateRangeCondition(filter.from, filter.to);
  if (dateRange) match[dateField] = dateRange;
  return match;
}

const workerIdExpr = { $ifNull: ['$employeeId', '$contractorEmployeeId'] };

/**
 * One ledger entry per SCHEDULED/COMPLETED assignment and per payment, in a common shape:
 * assignments contribute a day and their daily rate, payments their amount.
 */
function ledgerStages(companyId: string, filter: WorkerSummaryFilter): PipelineStage[] {
  return [
    {
      $match: {
        ...toMatch(companyId, filter, 'date'),
        status: { $in: [...ACTIVE_WORK_ASSIGNMENT_STATUSES] },
      },
    },
    {
      $project: {
        _id: 0,
        workerType: 1,
        workerId: workerIdExpr,
        contractorId: 1,
        siteId: 1,
        days: { $literal: 1 },
        earned: '$dailyRate',
        paid: { $literal: 0 },
      },
    },
    {
      $unionWith: {
        coll: PaymentModel.collection.name,
        pipeline: [
          { $match: toMatch(companyId, filter, 'paymentDate') },
          {
            $project: {
              _id: 0,
              workerType: 1,
              workerId: workerIdExpr,
              contractorId: 1,
              siteId: { $ifNull: ['$siteId', null] },
              days: { $literal: 0 },
              earned: { $literal: 0 },
              paid: '$amount',
            },
          },
        ],
      },
    },
  ];
}

const sumLedger = {
  assignedDays: { $sum: '$days' },
  earned: { $sum: '$earned' },
  paid: { $sum: '$paid' },
};

/** Replaces raw `earned`/`paid` sums with amounts rounded to two decimals. */
const roundAmountsStages: FacetStage[] = [
  {
    $set: {
      earnedAmount: { $round: ['$earned', 2] },
      paidAmount: { $round: ['$paid', 2] },
      outstandingAmount: { $round: [{ $subtract: ['$earned', '$paid'] }, 2] },
    },
  },
  { $unset: ['earned', 'paid'] },
];

function profileLookup(from: string, as: string, fields: Record<string, 1>): FacetStage {
  return {
    $lookup: {
      from,
      localField: 'workerId',
      foreignField: '_id',
      pipeline: [{ $project: { _id: 0, ...fields } }],
      as,
    },
  };
}

const workerProfileStages: FacetStage[] = [
  profileLookup(EmployeeModel.collection.name, 'employee', { name: 1, employeeCode: 1 }),
  profileLookup(ContractorEmployeeModel.collection.name, 'contractorEmployee', {
    name: 1,
    employeeCode: 1,
  }),
  {
    $set: {
      profile: {
        $cond: [
          { $eq: ['$workerType', WORKER_TYPES.EMPLOYEE] },
          { $first: '$employee' },
          { $first: '$contractorEmployee' },
        ],
      },
    },
  },
  { $set: { name: '$profile.name', employeeCode: '$profile.employeeCode' } },
  { $unset: ['employee', 'contractorEmployee', 'profile'] },
  ...nameLookup(
    ContractorModel.collection.name,
    'contractorId',
    { name: 1 },
    { name: 'contractorName' },
  ),
];

interface WorkerListFacet {
  items: WorkerTotalsRow[];
  summary: (FinancialTotalsRow & { workerCount: number })[];
}

/**
 * One row per worker with matching activity, highest outstanding amount first. Without `page`,
 * every matching worker is returned (e.g. for exports).
 */
export async function listWorkerTotals(
  companyId: string,
  filter: WorkerSummaryFilter,
  page?: SkipLimit,
): Promise<{
  items: WorkerTotalsRow[];
  summary: (FinancialTotalsRow & { workerCount: number }) | null;
}> {
  const [result] = await WorkAssignmentModel.aggregate<WorkerListFacet>([
    ...ledgerStages(companyId, filter),
    {
      $group: {
        _id: { workerType: '$workerType', workerId: '$workerId' },
        contractorId: { $max: '$contractorId' },
        ...sumLedger,
      },
    },
    { $set: { workerType: '$_id.workerType', workerId: '$_id.workerId' } },
    { $unset: '_id' },
    {
      $facet: {
        items: [
          ...roundAmountsStages,
          { $sort: { outstandingAmount: -1, workerId: 1 } },
          ...(page ? [{ $skip: page.skip }, { $limit: page.limit }] : []),
          ...workerProfileStages,
        ],
        summary: [
          {
            $group: {
              _id: null,
              workerCount: { $sum: 1 },
              assignedDays: { $sum: '$assignedDays' },
              earned: { $sum: '$earned' },
              paid: { $sum: '$paid' },
            },
          },
          ...roundAmountsStages,
          { $unset: '_id' },
        ],
      },
    },
  ]).exec();

  return { items: result?.items ?? [], summary: result?.summary[0] ?? null };
}

interface WorkerSummaryFacet {
  totals: FinancialTotalsRow[];
  sites: SiteTotalsRow[];
}

/** Totals for one worker plus a per-site breakdown, highest outstanding amount first. */
export async function summarizeWorker(
  companyId: string,
  filter: WorkerSummaryFilter & { worker: WorkerRef },
): Promise<{ totals: FinancialTotalsRow | null; sites: SiteTotalsRow[] }> {
  const [result] = await WorkAssignmentModel.aggregate<WorkerSummaryFacet>([
    ...ledgerStages(companyId, filter),
    {
      $facet: {
        totals: [{ $group: { _id: null, ...sumLedger } }, ...roundAmountsStages, { $unset: '_id' }],
        sites: [
          { $group: { _id: '$siteId', ...sumLedger } },
          ...roundAmountsStages,
          { $sort: { outstandingAmount: -1, _id: 1 } },
          {
            $lookup: {
              from: SiteModel.collection.name,
              localField: '_id',
              foreignField: '_id',
              pipeline: [{ $project: { _id: 0, name: 1, code: 1 } }],
              as: 'site',
            },
          },
          {
            $set: {
              siteId: '$_id',
              name: { $first: '$site.name' },
              code: { $first: '$site.code' },
            },
          },
          { $unset: ['_id', 'site'] },
        ],
      },
    },
  ]).exec();

  return { totals: result?.totals[0] ?? null, sites: result?.sites ?? [] };
}
