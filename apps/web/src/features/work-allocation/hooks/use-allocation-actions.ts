import { useState } from 'react';
import type { WorkAssignmentDto } from '@umc/shared';
import { toBulkRequest, type AssignDraft } from '../lib/assign-form';
import { assignResultNotice, errorNotice, type AllocationNotice } from '../lib/notices';
import { siteLabel } from '@/lib/sites';
import { assignmentWorkerKey } from '../lib/workers';
import type { AllocationReference } from './use-allocation-data';
import { useAllocationMutations } from './use-allocation-mutations';

/** The page's write actions, each reporting its outcome through `notice`. */
export function useAllocationActions(date: string, reference: AllocationReference) {
  const { assign, move, remove, pendingIds } = useAllocationMutations(date);
  const [notice, setNotice] = useState<AllocationNotice | null>(null);
  const { sitesById, workersByKey } = reference;

  const workerName = (assignment: WorkAssignmentDto) =>
    workersByKey.get(assignmentWorkerKey(assignment))?.name ?? 'Worker';

  /** Resolves `true` once the request went through, even if some workers were rejected. */
  const assignWorkers = async (draft: Omit<AssignDraft, 'date'>): Promise<boolean> => {
    try {
      const result = await assign.mutateAsync(toBulkRequest({ ...draft, date }));
      setNotice(assignResultNotice(result, sitesById.get(draft.siteId), workersByKey, sitesById));
      return true;
    } catch (error) {
      setNotice(errorNotice('Could not assign workers', error));
      return false;
    }
  };

  const moveAssignment = async (assignment: WorkAssignmentDto, siteId: string) => {
    const name = workerName(assignment);
    try {
      await move.mutateAsync({ id: assignment.id, siteId });
      setNotice({
        tone: 'success',
        title: `Moved ${name} to ${siteLabel(sitesById.get(siteId))}.`,
      });
    } catch (error) {
      setNotice(errorNotice(`Could not move ${name}`, error));
    }
  };

  const removeAssignment = async (assignment: WorkAssignmentDto) => {
    const name = workerName(assignment);
    try {
      await remove.mutateAsync({ id: assignment.id });
      setNotice({
        tone: 'success',
        title: `Removed ${name} from ${siteLabel(sitesById.get(assignment.siteId))}.`,
      });
    } catch (error) {
      setNotice(errorNotice(`Could not remove ${name}`, error));
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
