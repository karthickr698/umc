import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateWorkAssignmentRequest } from '@umc/shared';
import { allPagesQueryKey } from '@/hooks/use-all-pages-query';
import { deleteAssignment, updateAssignment, WORK_ALLOCATION_API } from '../work-allocation-api';

interface UpdateVariables {
  id: string;
  changes: UpdateWorkAssignmentRequest;
}

/**
 * Edit and remove a single assignment. An edit can move it to another day or site, so every
 * cached assignment list (days, months, worker histories) is refreshed afterwards.
 */
export function useAssignmentEditor() {
  const queryClient = useQueryClient();
  const [scope] = allPagesQueryKey(WORK_ALLOCATION_API.assignments);
  const refreshAssignments = () =>
    queryClient.invalidateQueries({
      predicate: ({ queryKey: [key, path] }) =>
        key === scope &&
        typeof path === 'string' &&
        path.startsWith(WORK_ALLOCATION_API.assignments),
    });

  const update = useMutation({
    mutationFn: ({ id, changes }: UpdateVariables) => updateAssignment(id, changes),
    onSettled: refreshAssignments,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSettled: refreshAssignments,
  });

  return { update, remove };
}
