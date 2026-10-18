import { type FormEvent, useId, useState } from 'react';
import { Search } from 'lucide-react';
import { SelectField } from '@/components/forms/select-field';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import type { ListParams } from '@/hooks/use-list-params';
import { humanizeEnum } from '@/utils/format';

const SEARCH_DELAY_MS = 350;

export interface ListFiltersProps {
  params: ListParams;
  statuses: readonly string[];
  /** What the search matches, e.g. "Name, email or phone"; used in the placeholder. */
  searchLabel: string;
  /** Singular, lower-case name of the records searched, e.g. "employee"; used in the placeholder. */
  noun?: string;
  onChange: (changes: Pick<ListParams, 'search' | 'status'>) => void;
}

/** Search box and status filter; the list updates as the user types. */
export function ListFilters({ params, statuses, searchLabel, noun, onChange }: ListFiltersProps) {
  const searchId = useId();
  const [search, setSearch] = useState(params.search);
  const [urlSearch, setUrlSearch] = useState(params.search);
  const statusOptions = statuses.map((status) => ({ value: status, label: humanizeEnum(status) }));

  // The URL can change without typing (back button, shared link); show its search then.
  if (params.search !== urlSearch) {
    setUrlSearch(params.search);
    if (params.search !== search.trim()) setSearch(params.search);
  }

  const applySearch = (value: string) => {
    if (value !== params.search) onChange({ search: value, status: params.status });
  };
  const debouncedSearch = useDebouncedCallback(applySearch, SEARCH_DELAY_MS);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    debouncedSearch.cancel();
    applySearch(search.trim());
  };

  return (
    <form className="filters card" role="search" onSubmit={handleSubmit}>
      <div className="field">
        <label className="field__label" htmlFor={searchId}>
          Search
        </label>
        <div className="field__control">
          <Search className="field__leading-icon" size={18} aria-hidden />
          <input
            id={searchId}
            className="field__input field__input--with-icon"
            type="search"
            placeholder={`Search ${noun ? `${noun}s ` : ''}by ${searchLabel.toLowerCase()}`}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              debouncedSearch.run(event.target.value.trim());
            }}
          />
        </div>
      </div>
      <div className="field--narrow">
        <SelectField
          label="Status"
          placeholder="All statuses"
          value={params.status}
          options={statusOptions}
          onChange={(status) => {
            debouncedSearch.cancel();
            onChange({ search: search.trim(), status });
          }}
        />
      </div>
    </form>
  );
}
