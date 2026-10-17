import type { ReactNode } from 'react';
import type { AllocationWorker } from '../lib/workers';

export interface WorkerOptionProps {
  worker: AllocationWorker;
  selected: boolean;
  onToggle: () => void;
  /** Where the worker already works that day; the worker can't be picked again. */
  assignedTo?: string;
  /** Extra control for an assigned worker, e.g. "Move here". */
  action?: ReactNode;
  disabled?: boolean;
}

export function WorkerOption({
  worker,
  selected,
  onToggle,
  assignedTo,
  action,
  disabled = false,
}: WorkerOptionProps) {
  const classes = [
    'worker-option',
    selected && 'worker-option--selected',
    assignedTo && 'worker-option--assigned',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={classes}>
      <label className="worker-option__label">
        <input
          type="checkbox"
          checked={selected}
          disabled={disabled || assignedTo !== undefined}
          onChange={onToggle}
        />
        <span className="worker-option__text">
          <span className="worker-option__name">{worker.name}</span>
          <span className="worker-option__meta">
            {worker.code} · {worker.role ?? 'Contractor worker'}
          </span>
        </span>
      </label>
      {assignedTo && <span className="badge badge--warn worker-option__site">{assignedTo}</span>}
      {action}
    </li>
  );
}
