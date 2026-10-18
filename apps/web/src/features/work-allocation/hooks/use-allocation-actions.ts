import { useState } from 'react';
import type { WorkAssignmentDto } from '@umc/shared';
import { useToast } from '@/hooks/use-toast';
import { toBulkRequest, type AssignDraft } from '../lib/assign-form';
import { assignResultNotice, errorNotice, type AllocationNotice } from '../lib/notices';
import { siteLabel } from '@/lib/sites';
import { assignmentWorkerKey } from '../lib/workers';
import type { AllocationReference } from './use-allocation-data';
import { useAllocationMutations } from './use-allocation-mutations';

/**
 * The page's write actions. Successes pop up as a toast; problems stay on the page as `notice`
 * until dismissed, since they may list several workers to read through.
 */
export function useAllocationActions(date: string, reference: AllocationReference) {
  const { assign, move, remove, pendingIds } = useAllocationMutations(date);
  const { showToast } = useToast();
  const [notice, setNotice] = useState<AllocationNotice | null>(null);
  const { sitesById, workersByKey } = reference;

  const report = (next: AllocationNotice) => {
    if (next.tone === 'success') {
      setNotice(null);
      showToast({ tone: 'success', title: next.title });
    } else {
      setNotice(next);
    }
  };

  const workerName = (assignment: WorkAssignmentDto) =>
    workersByKey.get(assignmentWorkerKey(assignment))?.name ?? 'Worker';

  /** Resolves `true` once the request went through, even if some workers were rejected. */
  const assignWorkers = async (draft: Omit<AssignDraft, 'date'>): Promise<boolean> => {
    try {
      const result = await assign.mutateAsync(toBulkRequest({ ...draft, date }));
      report(assignResultNotice(result, sitesById.get(draft.siteId), workersByKey, sitesById));
      return true;
    } catch (error) {
      report(errorNotice('Could not assign workers', error));
      return false;
    }
  };

  const moveAssignment = async (assignment: WorkAssignmentDto, siteId: string) => {
    const name = workerName(assignment);
    try {
      await move.mutateAsync({ id: assignment.id, siteId });
      report({ tone: 'success', title: `Moved ${name} to ${siteLabel(sitesById.get(siteId))}.` });
    } catch (error) {
      report(errorNotice(`Could not move ${name}`, error));
    }
  };

  const removeAssignment = async (assignment: WorkAssignmentDto) => {
    const name = workerName(assignment);
    try {
      await remove.mutateAsync({ id: assignment.id });
      report({
        tone: 'success',
        title: `Removed ${name} from ${siteLabel(sitesById.get(assignment.siteId))}.`,
      });
    } catch (error) {
      report(errorNotice(`Could not remove ${name}`, error));
    }
  };

  return {
    notice,
    dismissNotice: () => setNotice(null),
    assigning: assign.isPending,
    pendingIds,
    assignWorkers,
    moveAssignment,
    removeAssignment,
  };
}
