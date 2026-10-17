import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { Paginated } from '@umc/shared';
import { NAV_ITEMS, type NavItem } from '@/config/navigation';
import { useNavSections } from '@/hooks/use-nav-sections';
import { apiQueryOptions } from '@/lib/query-client';
import { SETUP_STEPS, type SetupStep } from '../lib/setup-steps';

export interface SetupStepState extends SetupStep {
  path: NavItem['path'];
  /** `undefined` while its lists are still loading. */
  done: boolean | undefined;
}

/** The setup steps this user may act on, each marked done once its pages have a record. */
export function useSetupProgress(): SetupStepState[] {
  const visible = useNavSections();
  const steps = useMemo(() => {
    const visibleIds = new Set(visible.flatMap((section) => section.items.map((item) => item.id)));
    return SETUP_STEPS.flatMap((step) => {
      const item = NAV_ITEMS.find(({ id }) => id === step.page);
      return item && visibleIds.has(item.id) ? [{ ...step, path: item.path }] : [];
    });
  }, [visible]);

  const paths = steps.flatMap((step) => step.lists);
  const results = useQueries({
    queries: paths.map((path) => apiQueryOptions<Paginated<unknown>>(path)),
  });
  // A list that failed to load counts as empty so one error can't hide the whole guide.
  const totals = new Map(
    paths.map((path, index) => {
      const result = results[index];
      return [path, result?.isError ? 0 : result?.data?.meta.total];
    }),
  );

  return steps.map((step) => {
    const counts = step.lists.map((path) => totals.get(path));
    const done = counts.some((count) => count !== undefined && count > 0)
      ? true
      : counts.every((count) => count !== undefined)
        ? false
        : undefined;
    return { ...step, done };
  });
}
