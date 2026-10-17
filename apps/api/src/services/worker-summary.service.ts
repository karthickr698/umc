import type {
  TenantUserDto,
  WorkerFinancialSummaryDto,
  WorkerFinancialTotals,
  WorkerSiteSummary,
  WorkerSummaryListDto,
  WorkerSummaryListItem,
  WorkerSummaryQuery,
} from '@umc/shared';
import * as workerSummaryRepository from '../repositories/worker-summary.repository.js';
import type {
  FinancialTotalsRow,
  SiteTotalsRow,
  WorkerSummaryFilter,
  WorkerTotalsRow,
} from '../repositories/worker-summary.repository.js';
import { fromCalendarDate } from '../utils/calendar-date.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type {
  ListWorkerSummariesInput,
  WorkerSummaryInput,
} from '../validators/worker-summary.validator.js';
import { assertSiteInCompany } from './work-assignment.service.js';
import { getWorkerProfile } from './worker.service.js';

const EMPTY_TOTALS: WorkerFinancialTotals = {
  assignedDays: 0,
  earnedAmount: 0,
  paidAmount: 0,
  outstandingAmount: 0,
};

export function toTotals(row: FinancialTotalsRow | null): WorkerFinancialTotals {
  if (!row) return EMPTY_TOTALS;
  return {
    assignedDays: row.assignedDays,
    earnedAmount: row.earnedAmount,
    paidAmount: row.paidAmount,
    outstandingAmount: row.outstandingAmount,
  };
}

export function toListItem(row: WorkerTotalsRow): WorkerSummaryListItem {
  return {
    worker: {
      id: row.workerId.toString(),
      workerType: row.workerType,
      // Workers with assignments or payments cannot be deleted, so the profile is always found.
      name: row.name ?? '',
      employeeCode: row.employeeCode ?? '',
      ...(row.contractorId && { contractorId: row.contractorId.toString() }),
      ...(row.contractorName !== undefined && { contractorName: row.contractorName }),
    },
    totals: toTotals(row),
  };
}

function toSiteSummary(row: SiteTotalsRow): WorkerSiteSummary {
  return {
    siteId: row.siteId ? row.siteId.toString() : null,
    ...(row.name !== undefined && { siteName: row.name }),
    ...(row.code !== undefined && { siteCode: row.code }),
    ...toTotals(row),
  };
}

/** The filters as echoed back to the client, without unset keys. */
function toFilters({ siteId, from, to }: WorkerSummaryQuery): WorkerSummaryQuery {
  return {
    ...(siteId !== undefined && { siteId }),
    ...(from !== undefined && { from }),
    ...(to !== undefined && { to }),
  };
}

/** Validates the site and converts the calendar-day range to stored dates. */
async function toRepositoryFilter(
  companyId: string,
  { siteId, from, to }: WorkerSummaryQuery,
): Promise<WorkerSummaryFilter> {
  if (siteId !== undefined) await assertSiteInCompany(companyId, siteId);
  return {
    ...(siteId !== undefined && { siteId }),
    ...(from !== undefined && { from: fromCalendarDate(from) }),
    ...(to !== undefined && { to: fromCalendarDate(to) }),
  };
}

export async function list(
  actor: TenantUserDto,
  { page, pageSize, workerType, ...query }: ListWorkerSummariesInput,
): Promise<WorkerSummaryListDto> {
  const filter = await toRepositoryFilter(actor.companyId, query);
  const { items, summary } = await workerSummaryRepository.listWorkerTotals(
    actor.companyId,
    { ...filter, ...(workerType !== undefined && { workerType }) },
    toSkipLimit({ page, pageSize }),
  );
  const workerCount = summary?.workerCount ?? 0;
  return {
    ...toPaginated(items.map(toListItem), workerCount, { page, pageSize }),
    filters: { ...toFilters(query), ...(workerType !== undefined && { workerType }) },
    totals: { ...toTotals(summary), workerCount },
  };
}

/** `workerId` may name an employee or a contractor employee. */
export async function getForWorker(
  actor: TenantUserDto,
  workerId: string,
  query: WorkerSummaryInput,
): Promise<WorkerFinancialSummaryDto> {
  const worker = await getWorkerProfile(actor.companyId, workerId);
  const filter = await toRepositoryFilter(actor.companyId, query);
  const { totals, sites } = await workerSummaryRepository.summarizeWorker(actor.companyId, {
    ...filter,
    worker: worker.ref,
  });
  return {
    worker: {
      id: worker.ref.workerId,
      workerType: worker.ref.workerType,
      name: worker.name,
      employeeCode: worker.employeeCode,
      ...(worker.contractorId !== undefined && { contractorId: worker.contractorId }),
    },
    filters: toFilters(query),
    totals: toTotals(totals),
    sites: sites.map(toSiteSummary),
  };
}
