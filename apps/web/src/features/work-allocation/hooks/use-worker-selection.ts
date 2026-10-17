import { useCallback, useState } from 'react';

export interface WorkerSelection {
  selected: ReadonlySet<string>;
  toggle: (key: string) => void;
  addMany: (keys: readonly string[]) => void;
  clear: () => void;
}

/** A set of picked `workerKey`s. */
export function useWorkerSelection(): WorkerSelection {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = useCallback(
    (key: string) =>
      setSelected((current) => {
        const next = new Set(current);
        if (!next.delete(key)) next.add(key);
        return next;
      }),
    [],
  );
  const addMany = useCallback(
    (keys: readonly string[]) => setSelected((current) => new Set([...current, ...keys])),
    [],
  );
  const clear = useCallback(() => setSelected(new Set()), []);

  return { selected, toggle, addMany, clear };
}
