import { ArrowRightLeft, MapPin } from 'lucide-react';
import { Avatar } from '@/components/data/avatar';
import { Spinner } from '@/components/feedback/spinner';
import type { AllocationWorker } from '../lib/workers';

export interface BusyWorkerOptionProps {
  worker: AllocationWorker;
  /** Name of the site the worker is already at that day. */
  siteName: string;
  /** Whether that site is the one being assigned to. */
  here: boolean;
  /** Omit when no target site is chosen, so the worker can't be moved. */
  onMoveHere?: () => void;
  pending: boolean;
}

/** A worker already assigned that day, who can be moved to the chosen site instead. */
export function BusyWorkerOption({
  worker,
  siteName,
  here,
  onMoveHere,
  pending,
}: BusyWorkerOptionProps) {
  return (
    <li className="crew-option crew-option--busy">
      <Avatar name={worker.name} muted />
      <span className="crew-option__text">
        <span className="crew-option__name">{worker.name}</span>
        <span className="crew-option__meta">
          <MapPin size={12} aria-hidden />
          {here ? 'Already at this site' : `Working at ${siteName}`}
        </span>
      </span>
      {pending && <Spinner size={16} label="Moving" />}
      {!here && onMoveHere && (
        <button
          type="button"
          className="button button--small"
          disabled={pending}
          title={`Move ${worker.name} from ${siteName} to the chosen site`}
          onClick={onMoveHere}
        >
          <ArrowRightLeft size={14} aria-hidden />
          Move here
        </button>
      )}
    </li>
  );
}
