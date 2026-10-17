import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { WORKER_TYPES, type WorkAssignmentDto } from '@umc/shared';
import { Spinner } from '@/components/feedback/spinner';
import { SelectField, type SelectOption } from '@/components/forms/select-field';
import { SectionCard } from '@/components/layout/section-card';
import type { AllocationReference } from '../hooks/use-allocation-data';
import { useWorkerSelection } from '../hooks/use-worker-selection';
import { assignDraftProblem, type AssignDraft } from '../lib/assign-form';
import { workerCount } from '../lib/notices';
import { DayPicker } from './day-picker';
import { WorkTypeField } from './work-type-field';
import { WorkerPicker } from './worker-picker';

export interface AssignPanelProps {
  date: string;
  siteId: string;
  onDateChange: (date: string) => void;
  onSiteChange: (siteId: string) => void;
  siteOptions: readonly SelectOption[];
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
 * Date, site, workers, work type, assign. The site and work type stick between submissions so
 * the next crew for the same site only needs picking; Ctrl/⌘+Enter submits from any field.
 */
export function AssignPanel({
  date,
  siteId,
  onDateChange,
  onSiteChange,
  siteOptions,
  reference,
  occupied,
  workTypeSuggestions,
  assigning,
  pendingIds,
  onAssign,
  onMoveHere,
}: AssignPanelProps) {
  const { selected, toggle, addMany, clear } = useWorkerSelection();
  const [workType, setWorkType] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const hintId = useId();

  const activeWorkers = reference.workers.filter((worker) => worker.active);
  // Workers who became busy since they were picked (another tab, a move) drop out on their own.
  const pickedWorkers = activeWorkers.filter(
    (worker) => selected.has(worker.key) && !occupied?.has(worker.key),
  );
  const draft = { siteId, workers: pickedWorkers, workType };
  const problem =
    occupied === undefined ? 'Loading the day…' : assignDraftProblem({ ...draft, date });
  const onlyEmployees = pickedWorkers.every(
    (worker) => worker.workerType === WORKER_TYPES.EMPLOYEE,
  );

  const submit = async () => {
    if (problem || assigning) return;
    if (await onAssign(draft)) {
      clear();
      searchRef.current?.focus();
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
    if (value) searchRef.current?.focus();
  };

  return (
    <SectionCard title="Assign workers" className="assign-panel">
      <form className="assign-panel__form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <DayPicker value={date} onChange={onDateChange} />
        <SelectField
          label="Site"
          placeholder="Choose a site"
          value={siteId}
          options={siteOptions}
          onChange={handleSiteChange}
        />
        <WorkerPicker
          workers={activeWorkers}
          occupied={occupied}
          sitesById={reference.sitesById}
          siteId={siteId}
          selected={selected}
          onToggle={toggle}
          onSelectMany={addMany}
          onClear={clear}
          onMoveHere={(assignment) => onMoveHere(assignment, siteId)}
          pendingIds={pendingIds}
          searchRef={searchRef}
        />
        <WorkTypeField
          value={workType}
          onChange={setWorkType}
          suggestions={workTypeSuggestions}
          optional={onlyEmployees}
        />
        <div className="assign-panel__footer">
          <button
            type="submit"
            className="button button--primary button--block"
            disabled={Boolean(problem) || assigning}
            aria-describedby={hintId}
          >
            {assigning ? (
              <Spinner size={16} label="Assigning" />
            ) : (
              <UserPlus size={16} aria-hidden />
            )}
            {pickedWorkers.length > 0 ? `Assign ${workerCount(pickedWorkers.length)}` : 'Assign'}
          </button>
          <p id={hintId} className="assign-panel__hint">
            {problem ?? 'Ctrl/⌘ + Enter to assign'}
          </p>
        </div>
      </form>
    </SectionCard>
  );
}
