import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Delays `callback` until `delay` ms pass without another call. The latest `callback` is the one
 * that runs, so it always sees current props. `cancel` drops a pending call, as does unmounting.
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay: number,
) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  const cancel = useCallback(() => window.clearTimeout(timerRef.current), []);

  const run = useCallback(
    (...args: A) => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay],
  );

  useEffect(() => cancel, [cancel]);

  return { run, cancel };
}
