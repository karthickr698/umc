import { type FormEvent, useId, useState } from 'react';
import { Search } from 'lucide-react';
import { SelectField } from '@/components/forms/select-field';
import type { ListParams } from '@/hooks/use-list-params';
import { humanizeEnum } from '@/utils/format';

export interface ListFiltersProps {
  params: ListParams;
  statuses: readonly string[];
  searchLabel: string;
  onChange: (changes: Pick<ListParams, 'search' | 'status'>) => void;
}

export function ListFilters({ params, statuses, searchLabel, onChange }: ListFiltersProps) {
  const searchId = useId();
  const [search, setSearch] = useState(params.search);
  const statusOptions = statuses.map((status) => ({ value: status, label: humanizeEnum(status) }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChange({ search: search.trim(), status: params.status });
  };

  return (
    <form className="filters card" role="search" onSubmit={handleSubmit}>
      <div className="field">
        <label className="field__label" htmlFor={searchId}>
          {searchLabel}
        </label>
        <div className="field__control">
          <Search className="field__leading-icon" size={18} aria-hidden />
          <input
            id={searchId}
            className="field__input field__input--with-icon"
            type="search"
            placeholder="Type to search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <div className="field--narrow">
        <SelectField
          label="Status"
          placeholder="All statuses"
          value={params.status}
          options={statusOptions}
          onChange={(status) => onChange({ search: search.trim(), status })}
        />
      </div>
      <button type="submit" className="button button--primary filters__submit">
        <Search size={16} aria-hidden />
        Search
      </button>
    </form>
  );
}
