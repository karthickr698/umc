import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { CONTRACTOR_EMPLOYEE_STATUSES } from '@umc/shared';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { humanizeEnum } from '@/utils/format';

const SEARCH_DELAY_MS = 350;
const STATUS_OPTIONS = ['', ...Object.values(CONTRACTOR_EMPLOYEE_STATUSES)] as const;

export interface ContractorWorkersToolbarProps {
  status: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  /** Absent when the user may not add workers. */
  onAdd?: () => void;
}

/** Search box, status tabs and the add button above a contractor's workers. */
export function ContractorWorkersToolbar({
  status,
  onSearchChange,
  onStatusChange,
  onAdd,
}: ContractorWorkersToolbarProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedCallback(onSearchChange, SEARCH_DELAY_MS);

  return (
    <div className="worker-toolbar">
      <div className="field__control">
        <Search className="field__leading-icon" size={18} aria-hidden />
        <input
          type="search"
          className="field__input field__input--with-icon"
          aria-label="Search workers"
          placeholder="Search workers by name, code or phone"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            debouncedSearch.run(event.target.value.trim());
          }}
        />
      </div>
      <div className="worker-toolbar__row">
        <div className="segmented" role="group" aria-label="Filter by status">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option || 'all'}
              type="button"
              className="segmented__option"
              aria-pressed={status === option}
              onClick={() => onStatusChange(option)}
            >
              {option ? humanizeEnum(option) : 'All'}
            </button>
          ))}
        </div>
        {onAdd && (
          <button type="button" className="button button--primary" onClick={onAdd}>
            <UserPlus size={16} aria-hidden />
            Add worker
          </button>
        )}
      </div>
    </div>
  );
}
