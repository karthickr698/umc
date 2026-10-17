import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Spinner } from '@/components/feedback/spinner';

export interface ConfirmButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'onClick' | 'onBlur' | 'children'
> {
  label: string;
  /** Shown after the first click; a second click runs `onConfirm`. */
  confirmLabel: string;
  pending?: boolean;
  pendingLabel?: string;
  icon?: ReactNode;
  onConfirm: () => void;
}

/** Destructive action that asks for a second click; moving focus away cancels it. */
export function ConfirmButton({
  label,
  confirmLabel,
  pending = false,
  pendingLabel = 'Working',
  icon = <Trash2 size={16} aria-hidden />,
  onConfirm,
  className,
  disabled,
  ...rest
}: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onConfirm();
  };

  return (
    <button
      {...rest}
      type="button"
      className={['button', confirming ? 'button--danger' : 'button--ghost', className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled ?? pending}
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
    >
      {pending ? <Spinner size={16} label={pendingLabel} /> : icon}
      {confirming ? confirmLabel : label}
    </button>
  );
}
