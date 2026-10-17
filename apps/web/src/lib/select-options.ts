import type { SelectOption } from '@/components/forms/select-field';
import { humanizeEnum } from '@/utils/format';

/** One option per value of an `*_STATUSES`-style map, in declaration order. */
export function enumOptions(values: Readonly<Record<string, string>>): SelectOption[] {
  return Object.values(values).map((value) => ({ value, label: humanizeEnum(value) }));
}

/** Option for a record picked by its name, e.g. a client or contractor. */
export function namedOption({ id, name }: { id: string; name: string }): SelectOption {
  return { value: id, label: name };
}

/** Option for an employee or contractor employee, e.g. `Ravi Kumar (EMP-001)`. */
export function employeeOption({
  id,
  name,
  employeeCode,
}: {
  id: string;
  name: string;
  employeeCode: string;
}): SelectOption {
  return { value: id, label: `${name} (${employeeCode})` };
}
