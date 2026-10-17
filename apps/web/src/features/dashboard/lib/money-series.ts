import type { DashboardTotals } from '@umc/shared';
import type { ChartSeries } from '@/components/charts/chart-series';

export type MoneyKey = Exclude<keyof DashboardTotals, 'balance'>;

/** Labels and colours of the four money flows, shared by the cards, charts and transactions. */
export const MONEY_SERIES = {
  clientPaymentsReceived: {
    key: 'clientPaymentsReceived',
    label: 'Client receipts',
    color: 'var(--chart-received)',
  },
  workerPayments: {
    key: 'workerPayments',
    label: 'Worker payments',
    color: 'var(--chart-workers)',
  },
  contractorPayments: {
    key: 'contractorPayments',
    label: 'Contractor payments',
    color: 'var(--chart-contractors)',
  },
  expenses: { key: 'expenses', label: 'Expenses', color: 'var(--chart-expenses)' },
} as const satisfies Record<MoneyKey, ChartSeries<MoneyKey>>;

/** Money paid out, in the order they are stacked and listed. */
export const OUTFLOW_SERIES = [
  MONEY_SERIES.workerPayments,
  MONEY_SERIES.contractorPayments,
  MONEY_SERIES.expenses,
] as const;

export function totalOutflow(totals: Pick<DashboardTotals, MoneyKey>): number {
  return OUTFLOW_SERIES.reduce((sum, series) => sum + totals[series.key], 0);
}
