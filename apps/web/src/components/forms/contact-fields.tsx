import { FIELD_LIMITS } from '@umc/shared';
import type { BoundField } from '@/hooks/use-entity-form';
import { TextField } from './text-field';

export function PhoneField(props: BoundField) {
  return (
    <TextField
      label="Phone"
      type="tel"
      autoComplete="off"
      placeholder="Optional"
      maxLength={FIELD_LIMITS.phone}
      {...props}
    />
  );
}

export function EmailField(props: BoundField) {
  return (
    <TextField
      label="Email"
      type="email"
      autoComplete="off"
      placeholder="Optional"
      maxLength={FIELD_LIMITS.email}
      {...props}
    />
  );
}
