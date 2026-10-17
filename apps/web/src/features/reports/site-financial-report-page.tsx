import type { SiteFinancialReportDto } from '@umc/shared';
import { QueryResult } from '@/components/data/query-result';
import { InlineAlert } from '@/components/feedback/inline-alert';
import { PageContainer } from '@/components/layout/page-container';
import { useApiQuery } from '@/hooks/use-api-query';
import { describeError } from '@/utils/describe-error';
import { CsvExportButton } from './components/csv-export-button';
import { SiteReportFilters } from './components/site-report-filters';
import { SiteReportSummary } from './components/site-report-summary';
import { SiteReportTable } from './components/site-report-table';
import { useCsvExport } from './hooks/use-csv-export';
import { useSiteReportFilters } from './hooks/use-site-report-filters';
import { downloadSiteFinancialCsv, REPORTS_API } from './reports-api';

export function SiteFinancialReportPage() {
  const { filters, reportFilters, activeCount, update, reset } = useSiteReportFilters();
  const report = useApiQuery<SiteFinancialReportDto>(REPORTS_API.siteFinancial(reportFilters));
  const csv = useCsvExport(() => downloadSiteFinancialCsv(reportFilters));

  return (
    <PageContainer
      title="Site financial report"
      description="Client receipts, worker payments, expenses and balance per site."
      actions={<CsvExportButton exporting={csv.exporting} onExport={csv.exportCsv} />}
    >
      <div className="stack">
        {csv.error !== undefined && (
          <InlineAlert tone="error" title="Export failed" onDismiss={csv.clearError}>
            {describeError(csv.error).message}
          </InlineAlert>
        )}
        <SiteReportFilters
          filters={filters}
          activeCount={activeCount}
          onChange={update}
          onReset={reset}
        />
        <QueryResult query={report}>
          {(result) => (
            <>
              <SiteReportSummary totals={result.totals} />
              <SiteReportTable
                result={result}
                loading={report.loading}
                filtered={activeCount > 0}
              />
            </>
          )}
        </QueryResult>
      </div>
    </PageContainer>
  );
}
