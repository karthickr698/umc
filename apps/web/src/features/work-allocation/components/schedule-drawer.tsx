import { ArrowLeft } from 'lucide-react';
import type { WorkAssignmentDto } from '@umc/shared';
import { Drawer } from '@/components/layout/drawer';
import { formatCalendarDate, humanizeEnum } from '@/utils/format';
import type { AllocationReference } from '../hooks/use-allocation-data';
import type { AllocationNotice } from '../lib/notices';
import { ROSTER_STATES, type RosterRow } from '../lib/roster';
import { isAssignableSite, siteLabel, toSiteOptions } from '@/lib/sites';
import { assignmentWorkerKey } from '../lib/workers';
import { EditAssignmentForm } from './edit-assignment-form';
import { WorkerDetails } from './worker-details';

export type SchedulePanel =
  | { kind: 'worker'; workerKey: string }
  /** `returnTo` is the worker whose details opened the editor, if any. */
  | { kind: 'edit'; assignment: WorkAssignmentDto; returnTo?: string };

export interface ScheduleDrawerProps {
  panel: SchedulePanel | null;
  onPanelChange: (panel: SchedulePanel | null) => void;
  date: string;
  /** The day's roster; `undefined` while it loads. */
  rows: readonly RosterRow[] | undefined;
  reference: AllocationReference;
  workTypeSuggestions: readonly string[];
  canManage: boolean;
  onNotice: (notice: AllocationNotice) => void;
}

/** One drawer for worker details and assignment editing, so focus handling stays in one place. */
export function ScheduleDrawer({
  panel,
  onPanelChange,
  date,
  rows,
  reference,
  workTypeSuggestions,
  canManage,
  onNotice,
}: ScheduleDrawerProps) {
  const { sitesById, workersByKey, assignableSites } = reference;
  const close = () => onPanelChange(null);

  const rowFor = (workerKey: string): RosterRow | undefined => {
    const row = rows?.find((item) => item.worker.key === workerKey);
    if (row) return row;
    const worker = workersByKey.get(workerKey);
    return worker && { worker, state: ROSTER_STATES.UNASSIGNED };
  };

  if (panel?.kind === 'worker') {
    const row = rowFor(panel.workerKey);
    return (
      <Drawer
        open={row !== undefined}
        title={row?.worker.name ?? 'Worker'}
        description={row && `${row.worker.code} · ${humanizeEnum(row.worker.workerType)}`}
        onClose={close}
      >
        {row && (
          <WorkerDetails
            key={row.worker.key}
            row={row}
            date={date}
            sitesById={sitesById}
            canManage={canManage}
            onEdit={(assignment) =>
              onPanelChange({ kind: 'edit', assignment, returnTo: row.worker.key })
            }
          />
        )}
      </Drawer>
    );
  }

  if (panel?.kind === 'edit') {
    const { assignment, returnTo } = panel;
    const name = workersByKey.get(assignmentWorkerKey(assignment))?.name ?? 'Worker';
    const current = sitesById.get(assignment.siteId);
    const siteOptions = toSiteOptions(
      current && !isAssignableSite(current) ? [...assignableSites, current] : assignableSites,
    );
    const back = () => onPanelChange(returnTo ? { kind: 'worker', workerKey: returnTo } : null);

    return (
      <Drawer
        open
        title="Edit assignment"
        description={`${name} · ${formatCalendarDate(assignment.date)}`}
        onClose={close}
        actions={
          returnTo && (
            <button type="button" className="button button--small button--ghost" onClick={back}>
              <ArrowLeft size={14} aria-hidden />
              Back
            </button>
          )
        }
      >
        <EditAssignmentForm
          key={assignment.id}
          assignment={assignment}
          siteOptions={siteOptions}
          sitesById={sitesById}
          workTypeSuggestions={workTypeSuggestions}
          onCancel={back}
          onSaved={(updated) => {
            const moved = updated.date !== assignment.date;
            onNotice({
              tone: 'success',
              title: moved
                ? `Moved ${name}'s assignment to ${formatCalendarDate(updated.date)}.`
                : `Saved ${name}'s assignment at ${siteLabel(sitesById.get(updated.siteId))}.`,
            });
            back();
          }}
          onRemoved={() => {
            onNotice({
              tone: 'success',
              title: `Removed ${name} from ${siteLabel(current)} on ${formatCalendarDate(assignment.date)}.`,
            });
            back();
          }}
        />
      </Drawer>
    );
  }

  return null;
}
