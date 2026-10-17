import { useSiteOptions } from '@/hooks/use-record-options';

/** Every site of the company, for a report's site filter. */
export function useReportSiteOptions() {
  return useSiteOptions();
}
