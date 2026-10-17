import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { isCalendarDate, toCalendarDate, today } from '@/utils/calendar-date';

const DATE_PARAM = 'date';
const SITE_PARAM = 'site';

export interface AllocationParams {
  /** `YYYY-MM-DD`; today unless the URL names another valid day. */
  date: string;
  /** Empty when no site is chosen. */
  siteId: string;
  setDate: (date: string) => void;
  setSiteId: (siteId: string) => void;
}

/** The chosen day and site, kept in the URL so a reload or shared link restores them. */
export function useAllocationParams(): AllocationParams {
  const [params, setParams] = useSearchParams();
  const rawDate = params.get(DATE_PARAM) ?? '';
  const date = isCalendarDate(rawDate) ? rawDate : toCalendarDate(today());
  const siteId = params.get(SITE_PARAM) ?? '';

  const setParam = useCallback(
    (key: string, value: string) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const setDate = useCallback((value: string) => setParam(DATE_PARAM, value), [setParam]);
  const setSiteId = useCallback((value: string) => setParam(SITE_PARAM, value), [setParam]);

  return { date, siteId, setDate, setSiteId };
}
