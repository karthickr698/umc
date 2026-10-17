import type { WorkAssignmentDto } from '@umc/shared';
import { occupiedWorkers } from './daily-board';
import { assignmentWorkerKey, matchesWorker, type AllocationWorker } from './workers';

export const ROSTER_STATES = {
  ASSIGNED: 'ASSIGNED',
  ELSEWHERE: 'ELSEWHERE',
  UNASSIGNED: 'UNASSIGNED',
} as const;

/**
 * `ASSIGNED`: works the day (at the chosen site, when one is chosen). `ELSEWHERE`: works the day
 * at another site. `UNASSIGNED`: free that day.
 */
export type RosterState = (typeof ROSTER_STATES)[keyof typeof ROSTER_STATES];

export const ROSTER_STATE_LABELS: Readonly<Record<RosterState, string>> = {
  [ROSTER_STATES.ASSIGNED]: 'Assigned',
  [ROSTER_STATES.ELSEWHERE]: 'Other site',
  [ROSTER_STATES.UNASSIGNED]: 'Unassigned',
};

export interface RosterRow {
  worker: AllocationWorker;
  state: RosterState;
  /** The assignment occupying the day; for a free worker, a cancelled one if there is any. */
  assignment?: WorkAssignmentDto;
}

export const ROSTER_FILTER_ALL = 'ALL';
export type RosterFilter = RosterState | typeof ROSTER_FILTER_ALL;

export type RosterCounts = Readonly<Record<RosterFilter, number>>;

const byPreferredSite = (siteId: string) => (a: WorkAssignmentDto, b: WorkAssignmentDto) =>
  Number(b.siteId === siteId) - Number(a.siteId === siteId) ||
  b.updatedAt.localeCompare(a.updatedAt);

/**
 * Every active worker for the day, plus inactive ones who still hold an assignment, in name order.
 * With `siteId` set, workers busy at other sites are told apart from those at the chosen site.
 */
export function buildRoster(
  workers: readonly AllocationWorker[],
  assignments: readonly WorkAssignmentDto[],
  siteId: string,
): RosterRow[] {
  const occupied = occupiedWorkers(assignments);
  const cancelled = new Map<string, WorkAssignmentDto>();
  for (const assignment of [...assignments].sort(byPreferredSite(siteId))) {
    const key = assignmentWorkerKey(assignment);
    if (!occupied.has(key) && !cancelled.has(key)) cancelled.set(key, assignment);
  }

  const rows: RosterRow[] = [];
  for (const worker of workers) {
    const active = occupied.get(worker.key);
    if (active) {
      const here = !siteId || active.siteId === siteId;
      rows.push({
        worker,
        state: here ? ROSTER_STATES.ASSIGNED : ROSTER_STATES.ELSEWHERE,
        assignment: active,
      });
    } else if (worker.active || cancelled.has(worker.key)) {
      rows.push({ worker, state: ROSTER_STATES.UNASSIGNED, assignment: cancelled.get(worker.key) });
    }
  }
  return rows;
}

export function countRoster(rows: readonly RosterRow[]): RosterCounts {
  const counts: Record<RosterFilter, number> = {
    [ROSTER_FILTER_ALL]: rows.length,
    [ROSTER_STATES.ASSIGNED]: 0,
    [ROSTER_STATES.ELSEWHERE]: 0,
    [ROSTER_STATES.UNASSIGNED]: 0,
  };
  for (const row of rows) counts[row.state] += 1;
  return counts;
}

export function filterRoster(
  rows: readonly RosterRow[],
  filter: RosterFilter,
  query: string,
): RosterRow[] {
  return rows.filter(
    (row) =>
      (filter === ROSTER_FILTER_ALL || row.state === filter) && matchesWorker(row.worker, query),
  );
}
