import { Fragment, type ReactNode } from 'react';

export interface DescriptionItem {
  label: string;
  /** Empty strings, `null` and `undefined` are shown as a dash. */
  value: ReactNode;
}

export function DescriptionList({ items }: { items: readonly DescriptionItem[] }) {
  return (
    <dl className="status-grid">
      {items.map(({ label, value }) => (
        <Fragment key={label}>
          <dt>{label}</dt>
          <dd>{value === '' || value === null || value === undefined ? '—' : value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
