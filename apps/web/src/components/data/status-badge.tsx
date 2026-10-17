import { humanizeEnum } from '@/utils/format';

const POSITIVE = new Set(['ACTIVE', 'COMPLETED']);
const NEGATIVE = new Set(['INACTIVE', 'SUSPENDED', 'CANCELLED']);

/** Any `*_STATUSES` value, coloured by whether it is healthy, stopped, or in between. */
export function StatusBadge({ status }: { status: string }) {
  const tone = POSITIVE.has(status) ? 'ok' : NEGATIVE.has(status) ? 'error' : 'warn';
  return <span className={`badge badge--${tone}`}>{humanizeEnum(status)}</span>;
}
