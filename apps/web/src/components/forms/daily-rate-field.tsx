import { EMPLOYEE_LIMITS } from '@umc/shared';
import type { BoundField } from '@/hooks/use-entity-form';
import { TextField } from './text-field';

/** Daily rate of an employee or contractor employee, in the company's currency. */
export function DailyRateField(props: BoundField) {
  return (
    <TextField
      label="Daily wage"
      type="number"
      inputMode="decimal"
      required
      min={0}
      max={EMPLOYEE_LIMITS.maxDailyRate}
      step={EMPLOYEE_LIMITS.dailyRateStep}
      {...props}
    />
  );
}
