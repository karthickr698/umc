import { isActiveWorkAssignmentStatus, type SiteDto, type WorkAssignmentDto } from '@umc/shared';
import { siteLabel } from '@/lib/sites';
import { assignmentWorkerKey, type AllocationWorker } from './workers';

export interface BoardAssignment {
  assignment: WorkAssignmentDto;
  /** Missing only if the worker record was deleted after it was loaded. */
  worker?: AllocationWorker;
  /** Whether it occupies the worker's day (cancelled assignments don't). */
  active: boolean;
}

export interface SiteGroup {
  siteId: string;
  site?: SiteDto;
  assignments: BoardAssignment[];
  activeCount: number;
}

/**
 * Each worker's assignment that occupies the day, keyed by `workerKey`. A worker can hold at
 * most one, so this is what the duplicate-assignment rule checks against.
 */
export function occupiedWorkers(
  assignments: readonly WorkAssignmentDto[],
): Map<string, WorkAssignmentDto> {
  const occupied = new Map<string, WorkAssignmentDto>();
  for (const assignment of assignments) {
    if (isActiveWorkAssignmentStatus(assignment.status)) {
      occupied.set(assignmentWorkerKey(assignment), assignment);
    }
  }
  return occupied;
}

const byWorkerName = (a: BoardAssignment, b: BoardAssignment) =>
  Number(b.active) - Number(a.active) || (a.worker?.name ?? '').localeCompare(b.worker?.name ?? '');

/** The day's assignments per site, sites by name and active workers first within each. */
export function groupBySite(
  assignments: readonly WorkAssignmentDto[],
  sitesById: ReadonlyMap<string, SiteDto>,
  workersByKey: ReadonlyMap<string, AllocationWorker>,
): SiteGroup[] {
  const groups = new Map<string, SiteGroup>();
  for (const assignment of assignments) {
    let group = groups.get(assignment.siteId);
    if (!group) {
      group = {
        siteId: assignment.siteId,
        site: sitesById.get(assignment.siteId),
        assignments: [],
        activeCount: 0,
      };
      groups.set(assignment.siteId, group);
    }
    const active = isActiveWorkAssignmentStatus(assignment.status);
    group.assignments.push({
      assignment,
      worker: workersByKey.get(assignmentWorkerKey(assignment)),
      active,
    });
    if (active) group.activeCount += 1;
  }

  return [...groups.values()]
    .map((group) => ({ ...group, assignments: group.assignments.sort(byWorkerName) }))
    .sort((a, b) => siteLabel(a.site).localeCompare(siteLabel(b.site)));
}
