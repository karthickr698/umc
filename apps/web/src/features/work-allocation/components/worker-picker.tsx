import { useState, type KeyboardEvent, type Ref } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { WORKER_TYPES, type SiteDto, type WorkAssignmentDto, type WorkerType } from '@umc/shared';
import { matchesWorker, type AllocationWorker } from '../lib/workers';
import { BusyWorkerOption } from './busy-worker-option';
import { WorkerOption } from './worker-option';

const ALL = 'ALL';
type TypeFilter = WorkerType | typeof ALL;

const TYPE_FILTERS: readonly { value: TypeFilter; label: string }[] = [
  { value: ALL, label: 'Everyone' },
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
  onMoveHere: (assignment: WorkAssignmentDto) => void;
  /** Assignments with a move or removal in flight. */
  pendingIds: ReadonlySet<string>;
  searchRef?: Ref<HTMLInputElement>;
}

/**
 * Searchable checklist of free workers. Pressing Enter in the search picks the first match, so a
 * crew can be entered from the keyboard alone. Workers already assigned that day are kept in a
 * separate, collapsed list where they can be moved to the chosen site instead.
 */
export function WorkerPicker({
  workers,
  occupied,
  sitesById,
  siteId,
  selected,
  onToggle,
  onSelectMany,
  onMoveHere,
  pendingIds,
  searchRef,
}: WorkerPickerProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(ALL);
  const [showBusy, setShowBusy] = useState(false);
  const loadingDay = occupied === undefined;
  const searching = query.trim() !== '';

  const visible = workers.filter(
    (worker) =>
      (typeFilter === ALL || worker.workerType === typeFilter) && matchesWorker(worker, query),
  );
  const free = visible.filter((worker) => !occupied?.has(worker.key));
  const busy = visible.filter((worker) => occupied?.has(worker.key));
  const freeUnselected = free.filter((worker) => !selected.has(worker.key));
  const busyExpanded = showBusy || searching;

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && query) {
      event.preventDefault();
      setQuery('');
    }
    if (event.key !== 'Enter' || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const first = freeUnselected[0];
    if (searching && first && !loadingDay) {
      onToggle(first.key);
      setQuery('');
    }
  };

  const emptyMessage = () => {
    if (workers.length === 0)
      return 'No active workers yet. Add employees or contractor workers first.';
    if (searching || typeFilter !== ALL) return 'Nobody free matches your search.';
    return 'Everyone is already working somewhere on this day.';
  };

  return (
    <div className="crew-picker" aria-busy={loadingDay}>
      <div className="crew-picker__toolbar">
        <div className="crew-picker__search">
          <Search className="crew-picker__search-icon" size={16} aria-hidden />
          <input
            ref={searchRef}
            type="text"
            className="field__input crew-picker__search-input"
            aria-label="Search workers"
            placeholder="Search by name, code or job"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {query && (
            <button
              type="button"
              className="icon-button crew-picker__search-clear"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>

        <div className="segmented crew-picker__filter" role="group" aria-label="Show">
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
      </div>

      <div className="crew-picker__section-header">
        <h4 className="crew-picker__section-title">
          Available{' '}
          <span className="crew-picker__section-count">{loadingDay ? '…' : free.length}</span>
        </h4>
        {freeUnselected.length > 1 && (
          <button
            type="button"
            className="button button--small button--ghost"
            disabled={loadingDay}
            onClick={() => onSelectMany(freeUnselected.map((worker) => worker.key))}
          >
            {searching || typeFilter !== ALL ? 'Select these' : 'Select all'} (
            {freeUnselected.length})
          </button>
        )}
      </div>

      {free.length === 0 ? (
        <p className="crew-picker__empty">{emptyMessage()}</p>
      ) : (
        <ul className="crew-picker__list" aria-label="Available workers">
          {free.map((worker) => (
            <WorkerOption
              key={worker.key}
              worker={worker}
              selected={selected.has(worker.key)}
              disabled={loadingDay}
              onToggle={() => onToggle(worker.key)}
            />
          ))}
        </ul>
      )}

      {busy.length > 0 && (
        <div className="crew-picker__busy">
          <button
            type="button"
            className="crew-picker__busy-toggle"
            aria-expanded={busyExpanded}
            disabled={searching}
            onClick={() => setShowBusy((current) => !current)}
          >
            <ChevronDown className="crew-picker__busy-chevron" size={16} aria-hidden />
            Already working on this day
            <span className="crew-picker__section-count">{busy.length}</span>
          </button>
          {busyExpanded && (
            <ul className="crew-picker__list" aria-label="Workers already assigned">
              {busy.map((worker) => {
                const assignment = occupied?.get(worker.key);
                if (!assignment) return null;
                return (
                  <BusyWorkerOption
                    key={worker.key}
                    worker={worker}
                    siteName={sitesById.get(assignment.siteId)?.name ?? 'another site'}
                    here={assignment.siteId === siteId}
                    pending={pendingIds.has(assignment.id)}
                    onMoveHere={siteId ? () => onMoveHere(assignment) : undefined}
                  />
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
