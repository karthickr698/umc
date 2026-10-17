import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

const VIEW_PARAM = 'view';

export const SCHEDULE_VIEWS = {
  CALENDAR: 'calendar',
  LIST: 'list',
} as const;

export type ScheduleView = (typeof SCHEDULE_VIEWS)[keyof typeof SCHEDULE_VIEWS];

function isScheduleView(value: string | null): value is ScheduleView {
  return Object.values<string | null>(SCHEDULE_VIEWS).includes(value);
}

/** Calendar or list layout, kept in the URL next to the chosen day and site. */
export function useScheduleView(): [ScheduleView, (view: ScheduleView) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(VIEW_PARAM);
  const view = isScheduleView(raw) ? raw : SCHEDULE_VIEWS.CALENDAR;

  const setView = useCallback(
    (next: ScheduleView) =>
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next === SCHEDULE_VIEWS.CALENDAR) updated.delete(VIEW_PARAM);
          else updated.set(VIEW_PARAM, next);
          return updated;
        },
        { replace: true },
      ),
    [setParams],
  );

  return [view, setView];
}
