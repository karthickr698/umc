import type { BulkCreateWorkAssignmentsResult, SiteDto } from '@umc/shared';
import type { InlineAlertTone } from '@/components/feedback/inline-alert';
import { siteLabel } from '@/lib/sites';
import { workerKey } from '@/lib/worker-key';
import { describeError } from '@/utils/describe-error';
import type { AllocationWorker } from './workers';

export interface AllocationNotice {
  tone: InlineAlertTone;
  title: string;
  details?: string[];
}

export function workerCount(count: number): string {
  return `${count} worker${count === 1 ? '' : 's'}`;
}

export function errorNotice(title: string, error: unknown): AllocationNotice {
  return { tone: 'error', title, details: [describeError(error).message] };
}

/** Summarises a bulk assignment, naming every worker that could not be assigned and why. */
export function assignResultNotice(
  result: BulkCreateWorkAssignmentsResult,
  site: SiteDto | undefined,
  workersByKey: ReadonlyMap<string, AllocationWorker>,
  sitesById: ReadonlyMap<string, SiteDto>,
): AllocationNotice {
  const assigned = result.succeeded.length;
  const total = assigned + result.failed.length;
  const target = siteLabel(site);
  if (result.failed.length === 0) {
    return { tone: 'success', title: `Assigned ${workerCount(assigned)} to ${target}.` };
  }

  const details = result.failed.map((failure) => {
    const name = workersByKey.get(workerKey(failure.workerType, failure.workerId))?.name;
    const where = failure.existingSiteId
      ? ` (${siteLabel(sitesById.get(failure.existingSiteId))})`
      : '';
    return `${name ?? 'Unknown worker'}: ${failure.message}${where}`;
  });
  return assigned === 0
    ? { tone: 'error', title: 'No workers were assigned.', details }
    : {
        tone: 'warn',
        title: `Assigned ${assigned} of ${workerCount(total)} to ${target}.`,
        details,
      };
}
