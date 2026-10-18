import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Info, UserPlus } from 'lucide-react';
import type { SiteDto, WorkAssignmentDto } from '@umc/shared';
import { Spinner } from '@/components/feedback/spinner';
import { SectionCard } from '@/components/layout/section-card';
import type { AllocationReference } from '../hooks/use-allocation-data';
import { useWorkerSelection } from '../hooks/use-worker-selection';
import { assignDraftProblem, needsWorkType, type AssignDraft } from '../lib/assign-form';
import { workerCount } from '../lib/notices';
import { AssignStep } from './assign-step';
import { SelectedWorkers } from './selected-workers';
import { SitePicker } from './site-picker';
import { WorkTypeField } from './work-type-field';
import { WorkerPicker } from './worker-picker';

export interface AssignPanelProps {
  date: string;
  siteId: string;
  onSiteChange: (siteId: string) => void;
  /** Sites that can take workers, sorted by name. */
  sites: readonly SiteDto[];
  /** Workers already at each site that day; `undefined` while the day loads. */
  assignedCounts: ReadonlyMap<string, number> | undefined;
  reference: AllocationReference;
  occupied: ReadonlyMap<string, WorkAssignmentDto> | undefined;
  workTypeSuggestions: readonly string[];
  assigning: boolean;
  pendingIds: ReadonlySet<string>;
  /** Resolves `true` when the request went through, which clears the picked workers. */
  onAssign: (draft: Omit<AssignDraft, 'date'>) => Promise<boolean>;
  onMoveHere: (assignment: WorkAssignmentDto, siteId: string) => void;
}

/**
 * Three numbered steps (site, workers, work type) and an assign button that spells out what will
 * happen. Every field resets after a successful assignment so the next one starts clean;
 * Ctrl/⌘+Enter submits from any field.
 */
export function AssignPanel({
  date,
  siteId,
  onSiteChange,
  sites,
  assignedCounts,
  reference,
  occupied,
  workTypeSuggestions,
  assigning,
  pendingIds,
  onAssign,
  onMoveHere,
}: AssignPanelProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const { selected, toggle, addMany, clear } = useWorkerSelection();
  const [workType, setWorkType] = useState('');
  // Bumped after each assignment to remount the worker picker, clearing its search and filter.
  const [resetCount, setResetCount] = useState(0);
  const ids = { site: useId(), workers: useId(), workType: useId(), hint: useId() };

  const activeWorkers = reference.workers.filter((worker) => worker.active);
  // Workers who became busy since they were picked (another tab, a move) drop out on their own.
  const pickedWorkers = activeWorkers.filter(
    (worker) => selected.has(worker.key) && !occupied?.has(worker.key),
  );
  const draft = { siteId, workers: pickedWorkers, workType };
  const problem =
    occupied === undefined ? 'Loading this day…' : assignDraftProblem({ ...draft, date });
  const workTypeRequired = needsWorkType(pickedWorkers);
  const siteName = reference.sitesById.get(siteId)?.name;

  const submit = async () => {
    if (problem || assigning) return;
    if (await onAssign(draft)) {
      clear();
      setWorkType('');
      onSiteChange('');
      setResetCount((count) => count + 1);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void submit();
    }
  };

  const handleSiteChange = (value: string) => {
    onSiteChange(value);
    if (value) searchRef.current?.focus({ preventScroll: true });
  };

  return (
    <SectionCard
      title="New assignment"
      description="Send workers to a site for the selected day."
      className="assign-panel"
    >
      <form className="assign-panel__form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <AssignStep
          number={1}
          title="Site"
          titleId={ids.site}
          hint="Where the workers will report for the day."
          done={Boolean(siteId)}
        >
          <SitePicker
            sites={sites}
            value={siteId}
            onChange={handleSiteChange}
            assignedCounts={assignedCounts}
            labelledBy={ids.site}
          />
        </AssignStep>

        <AssignStep
          number={2}
          title="Workers"
          titleId={ids.workers}
          hint="Select one or more workers who are free on this day."
          done={pickedWorkers.length > 0}
        >
          <SelectedWorkers workers={pickedWorkers} onRemove={toggle} onClear={clear} />
          <WorkerPicker
            key={resetCount}
            workers={activeWorkers}
            occupied={occupied}
            sitesById={reference.sitesById}
            siteId={siteId}
            selected={selected}
            onToggle={toggle}
            onSelectMany={addMany}
            onMoveHere={(assignment) => onMoveHere(assignment, siteId)}
            pendingIds={pendingIds}
            searchRef={searchRef}
          />
        </AssignStep>

        <AssignStep
          number={3}
          title="Work type"
          titleId={ids.workType}
          hint={
            workTypeRequired
              ? 'Required for contractor workers.'
              : "Leave empty to use each employee's own job role."
          }
          done={workTypeRequired ? Boolean(workType.trim()) : pickedWorkers.length > 0}
          aside={
            <span className={`badge ${workTypeRequired ? 'badge--warn' : 'badge--neutral'}`}>
              {workTypeRequired ? 'Required' : 'Optional'}
            </span>
          }
        >
          <WorkTypeField
            value={workType}
            onChange={setWorkType}
            suggestions={workTypeSuggestions}
            optional={!workTypeRequired}
            labelledBy={ids.workType}
          />
        </AssignStep>

        <div className="assign-bar">
          <p id={ids.hint} className="assign-bar__status" aria-live="polite">
            {problem ? (
              <>
                <Info size={16} aria-hidden />
                {problem}
              </>
            ) : (
              <span>
                Ready to send <strong>{workerCount(pickedWorkers.length)}</strong> to{' '}
                <strong>{siteName}</strong>.
              </span>
            )}
          </p>
          <button
            type="submit"
            className="button button--primary assign-bar__submit"
            disabled={Boolean(problem) || assigning}
            aria-describedby={ids.hint}
            title="Shortcut: Ctrl + Enter"
          >
            {assigning ? (
              <Spinner size={18} label="Assigning" />
            ) : (
              <UserPlus size={18} aria-hidden />
            )}
            {pickedWorkers.length > 0 ? `Assign ${workerCount(pickedWorkers.length)}` : 'Assign'}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
