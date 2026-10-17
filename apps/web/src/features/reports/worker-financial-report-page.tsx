import type { WorkerFinancialReportDto } from '@umc/shared';
import { QueryResult } from '@/components/data/query-result';
import { InlineAlert } from '@/components/feedback/inline-alert';
import { PageContainer } from '@/components/layout/page-container';
import { useApiQuery } from '@/hooks/use-api-query';
import { describeError } from '@/utils/describe-error';
import { CsvExportButton } from './components/csv-export-button';
import { WorkerReportFilters } from './components/worker-report-filters';
import { WorkerReportSummary } from './components/worker-report-summary';
import { WorkerReportTable } from './components/worker-report-table';
import { useCsvExport } from './hooks/use-csv-export';
import { useWorkerReportFilters } from './hooks/use-worker-report-filters';
import { downloadWorkerFinancialCsv, REPORTS_API } from './reports-api';

export function WorkerFinancialReportPage() {
  const { filters, reportFilters, query, activeCount, update, reset, setPage } =
    useWorkerReportFilters();
  const report = useApiQuery<WorkerFinancialReportDto>(REPORTS_API.workerFinancial(query));
  const csv = useCsvExport(() => downloadWorkerFinancialCsv(reportFilters));

  return (
    <PageContainer
      title="Worker financial report"
      description="Work days, earnings, payments and outstanding dues per worker."
      actions={<CsvExportButton exporting={csv.exporting} onExport={csv.exportCsv} />}
    >
      <div className="stack">
        {csv.error !== undefined && (
          <InlineAlert tone="error" title="Export failed" onDismiss={csv.clearError}>
            {describeError(csv.error).message}
          </InlineAlert>
        )}
        <WorkerReportFilters
          filters={filters}
          activeCount={activeCount}
          onChange={update}
          onReset={reset}
        />
        <QueryResult query={report}>
          {(result) => (
            <>
              <WorkerReportSummary totals={result.totals} />
              <WorkerReportTable
                result={result}
                loading={report.loading}
                filtered={activeCount > 0}
                onPageChange={setPage}
              />
            </>
          )}
        </QueryResult>
      </div>
    </PageContainer>
  );
}
