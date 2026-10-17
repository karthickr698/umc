import type { WorkAssignmentDto } from '@umc/shared';
import type { AllocationWorker } from './workers';

/** Suggestions for the work type field: employee roles plus types already used that day. */
export function workTypeSuggestions(
  workers: readonly AllocationWorker[],
  assignments: readonly WorkAssignmentDto[],
): string[] {
  const types = new Set<string>();
  for (const worker of workers) if (worker.role) types.add(worker.role);
  for (const assignment of assignments) types.add(assignment.workType);
  return [...types].sort((a, b) => a.localeCompare(b));
}
