import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';
import { allPagesQueryKey } from '@/hooks/use-all-pages-query';
import {
  bulkAssign,
  deleteAssignment,
  updateAssignment,
  WORK_ALLOCATION_API,
} from '../work-allocation-api';

interface MoveVariables {
  id: string;
  siteId: string;
}

interface RemoveVariables {
  id: string;
}

/** Shared by move and remove so rows can tell which of them have a change in flight. */
const ROW_MUTATION_KEY = ['work-allocation', 'row'] as const;

/** Assign, move and remove; each refreshes the day's assignments once it settles. */
export function useAllocationMutations(date: string) {
  const queryClient = useQueryClient();
  const refreshDay = () =>
    queryClient.invalidateQueries({
      queryKey: allPagesQueryKey(WORK_ALLOCATION_API.daily(date)),
    });

  const assign = useMutation({ mutationFn: bulkAssign, onSettled: refreshDay });
  const move = useMutation({
    mutationKey: ROW_MUTATION_KEY,
    mutationFn: ({ id, siteId }: MoveVariables) => updateAssignment(id, { siteId }),
    onSettled: refreshDay,
  });
  const remove = useMutation({
    mutationKey: ROW_MUTATION_KEY,
    mutationFn: ({ id }: RemoveVariables) => deleteAssignment(id),
    onSettled: refreshDay,
  });

  const pendingIds = new Set(
    useMutationState({
      filters: { mutationKey: ROW_MUTATION_KEY, status: 'pending' },
      // Both mutations under this key take `{ id }` variables.
      select: (mutation) => (mutation.state.variables as RemoveVariables).id,
    }),
  );

  return { assign, move, remove, pendingIds };
}
