import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * A create, update or delete of a record. On success every cached API read is refreshed: a
 * record's name and status also show up in pickers, schedules, reports and the dashboard.
 */
export function useResourceMutation<V, R>(mutationFn: (variables: V) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
