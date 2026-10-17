import type { ReactNode } from 'react';

/** A table cell's main value with a muted line below, e.g. a name over its code. */
export function StackedCell({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) {
  return (
    <>
      {primary}
      {secondary && <span className="table__secondary">{secondary}</span>}
    </>
  );
}
