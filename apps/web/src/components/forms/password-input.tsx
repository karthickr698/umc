import { type ComponentProps, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'>;

export function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field__control">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={['field__input field__input--with-action', className].filter(Boolean).join(' ')}
      />
      <button
        type="button"
        className="field__action"
        onClick={() => setVisible((value) => !value)}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}
