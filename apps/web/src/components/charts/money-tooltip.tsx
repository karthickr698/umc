import type { TooltipContentProps } from 'recharts';
import { formatAmount } from '@/utils/format';

export interface MoneyTooltipProps extends TooltipContentProps {
  formatLabel?: (label: string) => string;
  /** Adds a line with the sum of every series. */
  showTotal?: boolean;
}

/** Recharts tooltip listing each series' amount, formatted like the rest of the app. */
export function MoneyTooltip({
  active,
  payload,
  label,
  formatLabel,
  showTotal = false,
}: MoneyTooltipProps) {
  if (!active || payload.length === 0) return null;
  const title = label === undefined ? '' : String(label);
  const total = payload.reduce((sum, entry) => sum + Number(entry.value ?? 0), 0);

  return (
    <div className="chart-tooltip">
      {title && <p className="chart-tooltip__title">{formatLabel ? formatLabel(title) : title}</p>}
      <ul className="chart-tooltip__items">
        {payload.map((entry) => (
          <li key={String(entry.dataKey ?? entry.name)} className="chart-tooltip__item">
            <span
              className="chart-tooltip__swatch"
              style={{ background: entry.color }}
              aria-hidden
            />
            <span className="chart-tooltip__name">{entry.name}</span>
            <span className="chart-tooltip__value">{formatAmount(Number(entry.value ?? 0))}</span>
          </li>
        ))}
      </ul>
      {showTotal && (
        <p className="chart-tooltip__total">
          <span>Total</span>
          <span className="chart-tooltip__value">{formatAmount(total)}</span>
        </p>
      )}
    </div>
  );
}
