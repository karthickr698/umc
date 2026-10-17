import { useState, type KeyboardEvent, type Ref } from 'react';
import { Search } from 'lucide-react';
import { WORKER_TYPES, type SiteDto, type WorkAssignmentDto, type WorkerType } from '@umc/shared';
import { matchesWorker, type AllocationWorker } from '../lib/workers';
import { WorkerOption } from './worker-option';

const ALL = 'ALL';
type TypeFilter = WorkerType | typeof ALL;

const TYPE_FILTERS: readonly { value: TypeFilter; label: string }[] = [
  { value: ALL, label: 'All' },
  { value: WORKER_TYPES.EMPLOYEE, label: 'Employees' },
  { value: WORKER_TYPES.CONTRACTOR_EMPLOYEE, label: 'Contractor workers' },
];

export interface WorkerPickerProps {
  /** Workers that may be picked, sorted by name. */
  workers: readonly AllocationWorker[];
  /** Each worker's assignment occupying the day; `undefined` while the day loads. */
  occupied: ReadonlyMap<string, WorkAssignmentDto> | undefined;
  sitesById: ReadonlyMap<string, SiteDto>;
  /** The site being assigned to; empty when none is chosen yet. */
  siteId: string;
  selected: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onSelectMany: (keys: readonly string[]) => void;
  onClear: () => void;
  onMoveHere: (assignment: WorkAssignmentDto) => void;
  /** Assignments with a move or removal in flight. */
  pendingIds: ReadonlySet<string>;
  searchRef?: Ref<HTMLInputElement>;
}

/**
 * Searchable checklist of workers. Typing a name and pressing Enter picks the first free match,
 * so a crew can be entered from the keyboard alone. Workers already assigned that day are listed
 * last and can't be picked again; instead they can be moved to the chosen site.
 */
export function WorkerPicker({
  workers,
  occupied,
  sitesById,
  siteId,
  selected,
  onToggle,
  onSelectMany,
  onClear,
  onMoveHere,
  pendingIds,
  searchRef,
}: WorkerPickerProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(ALL);
  const loadingDay = occupied === undefined;

  const visible = workers.filter(
    (worker) =>
      (typeFilter === ALL || worker.workerType === typeFilter) && matchesWorker(worker, query),
  );
  const free = visible.filter((worker) => !occupied?.has(worker.key));
  const taken = visible.filter((worker) => occupied?.has(worker.key));
  const freeUnselected = free.filter((worker) => !selected.has(worker.key));

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && query) {
      event.preventDefault();
      setQuery('');
    }
    if (event.key !== 'Enter' || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const first = freeUnselected[0];
    if (query.trim() && first && !loadingDay) {
      onToggle(first.key);
      setQuery('');
    }
  };

  const renderTaken = (worker: AllocationWorker) => {
    const assignment = occupied?.get(worker.key);
    if (!assignment) return null;
    const here = assignment.siteId === siteId;
    const canMove = Boolean(siteId) && !here;
    return (
      <WorkerOption
        key={worker.key}
        worker={worker}
        selected={false}
        onToggle={() => undefined}
        assignedTo={
          here ? 'Here already' : (sitesById.get(assignment.siteId)?.name ?? 'Another site')
        }
        action={
          canMove && (
            <button
              type="button"
              className="button button--small"
              disabled={pendingIds.has(assignment.id)}
              onClick={() => onMoveHere(assignment)}
            >
              Move here
            </button>
          )
        }
      />
    );
  };

  return (
    <fieldset className="worker-picker" aria-busy={loadingDay}>
      <legend className="field__label">Workers</legend>

      <div className="worker-picker__search">
        <Search className="worker-picker__search-icon" size={16} aria-hidden />
        <input
          ref={searchRef}
          type="search"
          className="field__input worker-picker__search-input"
          aria-label="Search workers"
          placeholder="Type a name or code, Enter to pick"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      <div className="worker-picker__toolbar">
        <div className="segmented" role="group" aria-label="Worker type">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className="segmented__option"
              aria-pressed={typeFilter === filter.value}
              onClick={() => setTypeFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="worker-picker__bulk">
          <button
            type="button"
            className="button button--small button--ghost"
            disabled={loadingDay || freeUnselected.length === 0}
            onClick={() => onSelectMany(freeUnselected.map((worker) => worker.key))}
          >
            Select shown ({freeUnselected.length})
          </button>
          <button
            type="button"
            className="button button--small button--ghost"
            disabled={selected.size === 0}
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="worker-picker__empty">
          {workers.length === 0
            ? 'No active workers yet. Add employees or contractor workers first.'
            : 'No workers match your search.'}
        </p>
      ) : (
        <ul className="worker-picker__list">
          {free.map((worker) => (
            <WorkerOption
              key={worker.key}
              worker={worker}
              selected={selected.has(worker.key)}
              disabled={loadingDay}
              onToggle={() => onToggle(worker.key)}
            />
          ))}
          {taken.map(renderTaken)}
        </ul>
      )}
    </fieldset>
  );
}
