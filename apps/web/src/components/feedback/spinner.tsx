import { LoaderCircle } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  /** Announced to screen readers. */
  label?: string;
}

export function Spinner({ size = 20, label = 'Loading' }: SpinnerProps) {
  return (
    <span className="spinner" role="status">
      <LoaderCircle className="spinner__icon" size={size} aria-hidden />
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
