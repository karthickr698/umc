import { formatAmount, getInitials } from '@/utils/format';
import type { PaymentWorker } from '../lib/payment-workers';

export interface WorkerOptionProps {
  worker: PaymentWorker;
  /** Radio group name shared by every option of one picker. */
  name: string;
  checked: boolean;
  onSelect: (key: string) => void;
}

function Balance({ amount }: { amount: number }) {
  if (amount > 0) {
    return (
      <span className="worker-option__balance worker-option__balance--due">
        Due {formatAmount(amount)}
      </span>
    );
  }
  if (amount < 0) {
    return (
      <span className="worker-option__balance worker-option__balance--ahead">
        Advance {formatAmount(-amount)}
      </span>
    );
  }
  return <span className="worker-option__balance">Settled</span>;
}

export function WorkerOption({ worker, name, checked, onSelect }: WorkerOptionProps) {
  return (
    <label className="worker-option">
      <input
        type="radio"
        className="worker-option__input"
        name={name}
        value={worker.key}
        checked={checked}
        onChange={() => onSelect(worker.key)}
      />
      <span className="worker-option__avatar" aria-hidden>
        {getInitials(worker.name)}
      </span>
      <span className="worker-option__text">
        <span className="worker-option__name">{worker.name}</span>
        <span className="worker-option__meta">
          {worker.code} ·{' '}
          {worker.contractorId ? (worker.contractorName ?? 'Contractor') : 'Employee'}
        </span>
      </span>
      <Balance amount={worker.outstandingAmount} />
    </label>
  );
}
