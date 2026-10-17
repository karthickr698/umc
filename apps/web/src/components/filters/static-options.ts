import type { SelectOption } from '@/components/forms/select';
import type { SelectOptionsSource } from '@/hooks/use-select-options';

/** A fixed list (e.g. categories) as a filter's option source. */
export function staticOptions(options: readonly SelectOption[]): SelectOptionsSource {
  return { options: [...options], loading: false, failed: false };
}
