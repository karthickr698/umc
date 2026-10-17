import { useId, useState } from 'react';
import { Search, UserRoundX } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import type { ApiQuery } from '@/hooks/use-api-query';
import { describeError } from '@/utils/describe-error';
import { matchesPaymentWorker, type PaymentWorker } from '../lib/payment-workers';
import { WorkerOption } from './worker-option';

/** Above this many workers a search box is shown. */
const SEARCH_THRESHOLD = 6;
const SKELETON_ROWS = 3;

export interface WorkerPickerProps {
  workers: ApiQuery<PaymentWorker[]>;
  siteChosen: boolean;
  value: string;
  onChange: (key: string) => void;
  error?: string;
}

/**
 * Tap a row to pick; the list then collapses to the chosen worker so the rest of the form stays
 * in view on small screens.
 */
export function WorkerPicker({ workers, siteChosen, value, onChange, error }: WorkerPickerProps) {
  const [query, setQuery] = useState('');
  const [browsing, setBrowsing] = useState(false);
  const name = useId();
  const errorId = `${name}-error`;

  const selected = workers.data?.find((worker) => worker.key === value);
  const visible = workers.data?.filter((worker) => matchesPaymentWorker(worker, query)) ?? [];

  const pick = (key: string) => {
    setBrowsing(false);
    setQuery('');
    onChange(key);
  };

  const body = () => {
    if (!siteChosen) return <p className="worker-picker__hint">Pick a site to see its workers.</p>;
    if (workers.error !== undefined) {
      return (
        <ErrorState
          compact
          title="Could not load workers"
          message={describeError(workers.error).message}
          onRetry={workers.retry}
        />
      );
    }
    if (!workers.data) {
      return (
        <div className="worker-picker__list" aria-busy>
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} height="3.5rem" />
          ))}
        </div>
      );
    }
    if (workers.data.length === 0) {
      return (
        <EmptyState
          compact
          icon={UserRoundX}
          title="No workers at this site"
          message="Assign workers to this site in Assign Work before paying them."
        />
      );
    }
    if (selected && !browsing) {
      return (
        <div className="worker-picker__list">
          <WorkerOption worker={selected} name={name} checked onSelect={pick} />
          <button
            type="button"
            className="button button--ghost button--small worker-picker__change"
            onClick={() => setBrowsing(true)}
          >
            Change
          </button>
        </div>
      );
    }
    return (
      <>
        {workers.data.length > SEARCH_THRESHOLD && (
          <div className="field__control">
            <Search className="worker-picker__search-icon" size={16} aria-hidden />
            <input
              type="search"
              className="field__input worker-picker__search"
              placeholder="Search name, code or contractor"
              aria-label="Search workers"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        )}
        <div className="worker-picker__list worker-picker__list--scroll">
          {visible.map((worker) => (
            <WorkerOption
              key={worker.key}
              worker={worker}
              name={name}
              checked={worker.key === value}
              onSelect={pick}
            />
          ))}
          {visible.length === 0 && <p className="worker-picker__hint">No worker matches.</p>}
        </div>
      </>
    );
  };

  return (
    <fieldset
      className="field field-group worker-picker"
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="field__label">Worker / contractor</legend>
      {body()}
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
