import type {
  SiteFinancialReportDto,
  SiteFinancialReportRow,
  SiteFinancialTotals,
  TenantUserDto,
} from '@umc/shared';
import * as siteReportRepository from '../repositories/site-report.repository.js';
import type {
  SiteReportFilter,
  SiteReportTotalsRow,
} from '../repositories/site-report.repository.js';
import { fromCalendarDate } from '../utils/calendar-date.js';
import { csvFileName, toCsvDownload, type CsvCell } from '../utils/csv.js';
import { omitUndefined } from '../utils/object.js';
import type { FileDownload } from '../utils/send-file.js';
import type { SiteFinancialReportInput } from '../validators/site-report.validator.js';
import { assertSiteInCompany } from './work-assignment.service.js';

const CSV_HEADER = [
  'Site',
  'Site code',
  'Client receipts',
  'Employee payments',
  'Contractor payments',
  'Material expenses',
  'Other expenses',
  'Total expenses',
  'Balance',
] as const;

const CSV_FILE_PREFIX = 'site-financial-report';

/** Label of the row grouping receipts and payments not tied to a site. */
const NO_SITE_LABEL = 'Not tied to a site';

function toTotals(row: SiteReportTotalsRow | null | undefined): SiteFinancialTotals {
  return {
    clientReceipts: row?.clientReceipts ?? 0,
    employeePayments: row?.employeePayments ?? 0,
    contractorPayments: row?.contractorPayments ?? 0,
    materialExpenses: row?.materialExpenses ?? 0,
    otherExpenses: row?.otherExpenses ?? 0,
    totalExpenses: row?.totalExpenses ?? 0,
    balance: row?.balance ?? 0,
  };
}

async function toRepositoryFilter(
  companyId: string,
  { siteId, from, to }: SiteFinancialReportInput,
): Promise<SiteReportFilter> {
  if (siteId !== undefined) await assertSiteInCompany(companyId, siteId);
  return {
    ...(siteId !== undefined && { siteId }),
    ...(from !== undefined && { from: fromCalendarDate(from) }),
    ...(to !== undefined && { to: fromCalendarDate(to) }),
  };
}

/** Client receipts, worker payments and expenses per site matching the filters, with totals. */
export async function getSiteFinancialReport(
  actor: TenantUserDto,
  query: SiteFinancialReportInput,
): Promise<SiteFinancialReportDto> {
  const { totals, sites } = await siteReportRepository.summarizeBySite(
    actor.companyId,
    await toRepositoryFilter(actor.companyId, query),
  );
  return {
    filters: omitUndefined(query),
    totals: { ...toTotals(totals), siteCount: sites.filter((row) => row.siteId).length },
    sites: sites.map((row): SiteFinancialReportRow => ({
      siteId: row.siteId ? row.siteId.toString() : null,
      ...(row.name !== undefined && { siteName: row.name }),
      ...(row.code !== undefined && { siteCode: row.code }),
      ...toTotals(row),
    })),
  };
}

function amountCells(totals: SiteFinancialTotals): CsvCell[] {
  return [
    totals.clientReceipts,
    totals.employeePayments,
    totals.contractorPayments,
    totals.materialExpenses,
    totals.otherExpenses,
    totals.totalExpenses,
    totals.balance,
  ];
}

/** Every matching site followed by a totals row. */
export async function exportSiteFinancialReport(
  actor: TenantUserDto,
  query: SiteFinancialReportInput,
): Promise<Omit<FileDownload, 'disposition'>> {
  const { totals, sites } = await getSiteFinancialReport(actor, query);
  return toCsvDownload(csvFileName(CSV_FILE_PREFIX, query), CSV_HEADER, [
    ...sites.map((row) => [
      row.siteId ? (row.siteName ?? '') : NO_SITE_LABEL,
      row.siteCode ?? '',
      ...amountCells(row),
    ]),
    [`Total (${totals.siteCount} sites)`, '', ...amountCells(totals)],
  ]);
}
