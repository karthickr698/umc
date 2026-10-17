import {
  API_ROUTES,
  type SiteFinancialReportFilters,
  type WorkerFinancialReportFilters,
  type WorkerFinancialReportQuery,
} from '@umc/shared';
import { apiFile } from '@/lib/api-client';
import { withQuery } from '@/utils/query-string';

const { reports, employees, contractors, contractorEmployees } = API_ROUTES;

const WORKER_CSV_FALLBACK_NAME = 'worker-financial-report.csv';
const SITE_CSV_FALLBACK_NAME = 'site-financial-report.csv';

/** API paths used by the reports pages, relative to the API base URL. */
export const REPORTS_API = {
  workerFinancial: (query: WorkerFinancialReportQuery) =>
    withQuery(`${reports.base}${reports.workerFinancial}`, { ...query }),
  workerFinancialExport: (filters: WorkerFinancialReportFilters) =>
    withQuery(`${reports.base}${reports.workerFinancialExport}`, { ...filters }),
  siteFinancial: (filters: SiteFinancialReportFilters) =>
    withQuery(`${reports.base}${reports.siteFinancial}`, { ...filters }),
  siteFinancialExport: (filters: SiteFinancialReportFilters) =>
    withQuery(`${reports.base}${reports.siteFinancialExport}`, { ...filters }),
  employees: employees.base,
  contractors: contractors.base,
  contractorEmployees: contractorEmployees.base,
};

export interface ReportFile {
  blob: Blob;
  fileName: string;
}

async function downloadFile(path: string, fallbackName: string): Promise<ReportFile> {
  const { blob, fileName } = await apiFile(path);
  return { blob, fileName: fileName ?? fallbackName };
}

export function downloadWorkerFinancialCsv(
  filters: WorkerFinancialReportFilters,
): Promise<ReportFile> {
  return downloadFile(REPORTS_API.workerFinancialExport(filters), WORKER_CSV_FALLBACK_NAME);
}

export function downloadSiteFinancialCsv(filters: SiteFinancialReportFilters): Promise<ReportFile> {
  return downloadFile(REPORTS_API.siteFinancialExport(filters), SITE_CSV_FALLBACK_NAME);
}
