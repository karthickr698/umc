import { useCallback, useState } from 'react';

function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : stored === 'true';
  } catch {
    return fallback;
  }
}

/** Boolean state mirrored to localStorage; storage failures (e.g. private mode) are ignored. */
export function usePersistentBoolean(
  key: string,
  fallback: boolean,
): [value: boolean, setValue: (next: boolean) => void] {
  const [value, setValue] = useState(() => readStoredBoolean(key, fallback));

  const update = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        // Preference just won't survive a reload.
      }
    },
    [key],
  );

  return [value, update];
}
