import type { ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

export interface AuthSubmitButtonProps {
  submitting: boolean;
  icon: ReactNode;
  label: string;
  busyLabel: string;
}

export function AuthSubmitButton({ submitting, icon, label, busyLabel }: AuthSubmitButtonProps) {
  return (
    <button type="submit" className="button button--primary button--block">
      {submitting ? (
        <>
          <LoaderCircle className="spinner__icon" size={16} aria-hidden />
          {busyLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
}
