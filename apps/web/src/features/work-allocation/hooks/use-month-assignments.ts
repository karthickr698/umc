import type { WorkAssignmentDto } from '@umc/shared';
import type { ApiQuery } from '@/hooks/use-api-query';
import { useAllPagesQuery } from '@/hooks/use-all-pages-query';
import { monthRange } from '../lib/calendar';
import { WORK_ALLOCATION_API } from '../work-allocation-api';

/** Every assignment in the month containing `day`, limited to `siteId` when one is chosen. */
export function useMonthAssignments(day: string, siteId: string): ApiQuery<WorkAssignmentDto[]> {
  const { from, to } = monthRange(day);
  return useAllPagesQuery<WorkAssignmentDto>(WORK_ALLOCATION_API.assignments, {
    from,
    to,
    siteId: siteId || undefined,
  });
}
