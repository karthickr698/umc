import {
  WORKER_TYPE_LABELS,
  WORKER_TYPES,
  type TenantUserDto,
  type WorkerFinancialReportDto,
  type WorkerFinancialReportFilters,
  type WorkerSummaryListItem,
} from '@umc/shared';
import * as workerSummaryRepository from '../repositories/worker-summary.repository.js';
import type { WorkerSummaryFilter } from '../repositories/worker-summary.repository.js';
import { fromCalendarDate } from '../utils/calendar-date.js';
import { csvFileName, toCsvDownload, type CsvCell } from '../utils/csv.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type { FileDownload } from '../utils/send-file.js';
import type {
  WorkerFinancialReportFiltersInput,
  WorkerFinancialReportInput,
} from '../validators/worker-report.validator.js';
import { assertContractorInCompany } from './contractor.service.js';
import { assertSiteInCompany } from './work-assignment.service.js';
import { resolveContractorEmployee, resolveEmployee } from './worker.service.js';
import { toListItem, toTotals } from './worker-summary.service.js';

const CSV_HEADER = [
  'Worker',
  'Employee code',
  'Worker type',
  'Contractor',
  'Work days',
  'Earned amount',
  'Paid amount',
  'Outstanding amount',
] as const;

const CSV_FILE_PREFIX = 'worker-financial-report';

/** The filters as echoed back to the client, without unset keys. */
function toFilters({
  from,
  to,
  siteId,
  employeeId,
  contractorId,
  contractorEmployeeId,
}: WorkerFinancialReportFilters): WorkerFinancialReportFilters {
  return {
    ...(from !== undefined && { from }),
    ...(to !== undefined && { to }),
    ...(siteId !== undefined && { siteId }),
    ...(employeeId !== undefined && { employeeId }),
    ...(contractorId !== undefined && { contractorId }),
    ...(contractorEmployeeId !== undefined && { contractorEmployeeId }),
  };
}

function workerRefOf({
  employeeId,
  contractorEmployeeId,
}: WorkerFinancialReportFiltersInput): WorkerSummaryFilter['worker'] {
  if (employeeId !== undefined) return { workerType: WORKER_TYPES.EMPLOYEE, workerId: employeeId };
  if (contractorEmployeeId !== undefined) {
    return { workerType: WORKER_TYPES.CONTRACTOR_EMPLOYEE, workerId: contractorEmployeeId };
  }
  return undefined;
}

/** Checks every filtered record belongs to the company (in parallel) and converts the dates. */
async function toRepositoryFilter(
  companyId: string,
  filters: WorkerFinancialReportFiltersInput,
): Promise<WorkerSummaryFilter> {
  const { siteId, employeeId, contractorId, contractorEmployeeId, from, to } = filters;
  await Promise.all([
    siteId !== undefined && assertSiteInCompany(companyId, siteId),
    employeeId !== undefined && resolveEmployee(companyId, employeeId),
    contractorEmployeeId !== undefined
      ? resolveContractorEmployee(companyId, contractorEmployeeId, contractorId)
      : contractorId !== undefined && assertContractorInCompany(companyId, contractorId),
  ]);

  const worker = workerRefOf(filters);
  return {
    ...(siteId !== undefined && { siteId }),
    ...(worker && { worker }),
    ...(contractorId !== undefined && { contractorId }),
    ...(from !== undefined && { from: fromCalendarDate(from) }),
    ...(to !== undefined && { to: fromCalendarDate(to) }),
  };
}

export async function getWorkerFinancialReport(
  actor: TenantUserDto,
  { page, pageSize, ...filters }: WorkerFinancialReportInput,
): Promise<WorkerFinancialReportDto> {
  const { items, summary } = await workerSummaryRepository.listWorkerTotals(
    actor.companyId,
    await toRepositoryFilter(actor.companyId, filters),
    toSkipLimit({ page, pageSize }),
  );
  const workerCount = summary?.workerCount ?? 0;
  return {
    ...toPaginated(items.map(toListItem), workerCount, { page, pageSize }),
    filters: toFilters(filters),
    totals: { ...toTotals(summary), workerCount },
  };
}

function toCsvRow({ worker, totals }: WorkerSummaryListItem): CsvCell[] {
  return [
    worker.name,
    worker.employeeCode,
    WORKER_TYPE_LABELS[worker.workerType],
    worker.contractorName ?? '',
    totals.assignedDays,
    totals.earnedAmount,
    totals.paidAmount,
    totals.outstandingAmount,
  ];
}

/** Every matching worker (not paginated) followed by a totals row. */
export async function exportWorkerFinancialReport(
  actor: TenantUserDto,
  filters: WorkerFinancialReportFiltersInput,
): Promise<Omit<FileDownload, 'disposition'>> {
  const { items, summary } = await workerSummaryRepository.listWorkerTotals(
    actor.companyId,
    await toRepositoryFilter(actor.companyId, filters),
  );
  const totals = toTotals(summary);
  const workerCount = summary?.workerCount ?? 0;
  return toCsvDownload(csvFileName(CSV_FILE_PREFIX, filters), CSV_HEADER, [
    ...items.map((row) => toCsvRow(toListItem(row))),
    [
      `Total (${workerCount} workers)`,
      '',
      '',
      '',
      totals.assignedDays,
      totals.earnedAmount,
      totals.paidAmount,
      totals.outstandingAmount,
    ],
  ]);
}
