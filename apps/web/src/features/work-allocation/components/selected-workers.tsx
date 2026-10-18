import { X } from 'lucide-react';
import type { AllocationWorker } from '../lib/workers';
import { workerCount } from '../lib/notices';

export interface SelectedWorkersProps {
  workers: readonly AllocationWorker[];
  onRemove: (key: string) => void;
  onClear: () => void;
}

/** The picked workers as removable chips, so the choice stays visible while searching. */
export function SelectedWorkers({ workers, onRemove, onClear }: SelectedWorkersProps) {
  if (workers.length === 0) return null;

  return (
    <div className="selected-workers" aria-live="polite">
      <div className="selected-workers__header">
        <span className="selected-workers__count">{workerCount(workers.length)} selected</span>
        <button type="button" className="button button--small button--ghost" onClick={onClear}>
          Clear all
        </button>
      </div>
      <ul className="selected-workers__list">
        {workers.map((worker) => (
          <li key={worker.key} className="worker-chip">
            <span className="worker-chip__name">{worker.name}</span>
            <button
              type="button"
              className="worker-chip__remove"
              aria-label={`Remove ${worker.name} from the selection`}
              onClick={() => onRemove(worker.key)}
            >
              <X size={14} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
