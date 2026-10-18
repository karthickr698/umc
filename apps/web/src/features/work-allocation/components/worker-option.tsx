import { Avatar } from '@/components/data/avatar';
import { workerDescription, type AllocationWorker } from '../lib/workers';

export interface WorkerOptionProps {
  worker: AllocationWorker;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/** A free worker; the whole row toggles the checkbox. */
export function WorkerOption({ worker, selected, onToggle, disabled = false }: WorkerOptionProps) {
  return (
    <li>
      <label className={`crew-option${selected ? ' crew-option--selected' : ''}`}>
        <input
          type="checkbox"
          className="crew-option__check"
          checked={selected}
          disabled={disabled}
          onChange={onToggle}
        />
        <Avatar name={worker.name} />
        <span className="crew-option__text">
          <span className="crew-option__name">{worker.name}</span>
          <span className="crew-option__meta">{workerDescription(worker)}</span>
        </span>
      </label>
    </li>
  );
}
