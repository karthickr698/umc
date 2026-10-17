import { useState } from 'react';
import { Search, UsersRound } from 'lucide-react';
import type { SiteDto } from '@umc/shared';
import { EmptyState } from '@/components/feedback/empty-state';
import {
  countRoster,
  filterRoster,
  ROSTER_FILTER_ALL,
  ROSTER_STATE_LABELS,
  ROSTER_STATES,
  type RosterFilter,
  type RosterRow as RosterRowData,
} from '../lib/roster';
import { RosterRow } from './roster-row';

export interface WorkerRosterProps {
  rows: readonly RosterRowData[];
  /** Whether a site is chosen; only then can a worker be busy at "another" site. */
  siteChosen: boolean;
  sitesById: ReadonlyMap<string, SiteDto>;
  showRate: boolean;
  canManage: boolean;
  onOpenWorker: (row: RosterRowData) => void;
  onEdit: (row: RosterRowData) => void;
}

/** Every worker for the day with their assignment state, filterable by state and name. */
export function WorkerRoster({
  rows,
  siteChosen,
  sitesById,
  showRate,
  canManage,
  onOpenWorker,
  onEdit,
}: WorkerRosterProps) {
  const [filter, setFilter] = useState<RosterFilter>(ROSTER_FILTER_ALL);
  const [query, setQuery] = useState('');

  const filters: RosterFilter[] = [
    ROSTER_FILTER_ALL,
    ROSTER_STATES.ASSIGNED,
    ROSTER_STATES.UNASSIGNED,
    ...(siteChosen ? [ROSTER_STATES.ELSEWHERE] : []),
  ];
  const activeFilter = filters.includes(filter) ? filter : ROSTER_FILTER_ALL;
  const counts = countRoster(rows);
  const visible = filterRoster(rows, activeFilter, query);

  if (rows.length === 0) {
    return (
      <EmptyState
        compact
        icon={UsersRound}
        title="No workers yet"
        message="Add employees or contractor workers to start assigning them to sites."
      />
    );
  }

  return (
    <div className="roster">
      <div className="roster__toolbar">
        <div className="segmented" role="group" aria-label="Show workers">
          {filters.map((option) => (
            <button
              key={option}
              type="button"
              className="segmented__option"
              aria-pressed={activeFilter === option}
              onClick={() => setFilter(option)}
            >
              {option === ROSTER_FILTER_ALL ? 'All' : ROSTER_STATE_LABELS[option]}
              <span className="roster__count">{counts[option]}</span>
            </button>
          ))}
        </div>
        <div className="roster__search">
          <Search className="roster__search-icon" size={16} aria-hidden />
          <input
            type="search"
            className="field__input roster__search-input"
            aria-label="Search workers"
            placeholder="Search name, code or role"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="table-scroll roster__table">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Worker</th>
              <th scope="col">State</th>
              <th scope="col">Site · work type</th>
              <th scope="col">Status</th>
              {showRate && (
                <th scope="col" className="table__numeric">
                  Daily rate
                </th>
              )}
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <RosterRow
                key={row.worker.key}
                row={row}
                sitesById={sitesById}
                showRate={showRate}
                canManage={canManage}
                onOpenWorker={() => onOpenWorker(row)}
                onEdit={() => onEdit(row)}
              />
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="table-message">No workers match this view.</p>}
      </div>
    </div>
  );
}
