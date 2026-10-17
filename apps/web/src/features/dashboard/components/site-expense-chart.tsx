import { useMemo } from 'react';
import { ChartColumn } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardSiteTotals } from '@umc/shared';
import { ChartFrame } from '@/components/charts/chart-frame';
import {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_LEGEND_PROPS,
} from '@/components/charts/chart-theme';
import { MoneyTooltip } from '@/components/charts/money-tooltip';
import { EmptyState } from '@/components/feedback/empty-state';
import { SectionCard } from '@/components/layout/section-card';
import { TABLET_MEDIA_QUERY } from '@/config/layout';
import { useMediaQuery } from '@/hooks/use-media-query';
import { formatCompactAmount, truncate } from '@/utils/format';
import { OUTFLOW_SERIES } from '../lib/money-series';
import { toSiteSpendRows } from '../lib/site-spend';

const MAX_SITES = 8;
const ROW_HEIGHT = 44;
const CHROME_HEIGHT = 72;
const LAST_SERIES_INDEX = OUTFLOW_SERIES.length - 1;

export interface SiteExpenseChartProps {
  bySite: readonly DashboardSiteTotals[];
}

/** Stacked spend per site, highest first, so the costliest sites stand out. */
export function SiteExpenseChart({ bySite }: SiteExpenseChartProps) {
  const wide = useMediaQuery(TABLET_MEDIA_QUERY);
  const rows = useMemo(() => toSiteSpendRows(bySite), [bySite]);
  const shown = rows.slice(0, MAX_SITES);

  return (
    <SectionCard
      title="Site expenses"
      description={
        rows.length > MAX_SITES
          ? `Top ${MAX_SITES} of ${rows.length} sites by total spend.`
          : 'Worker payments, contractor payments and expenses per site.'
      }
    >
      {shown.length === 0 ? (
        <EmptyState
          compact
          icon={ChartColumn}
          title="No site spending"
          message="No payments or expenses match these filters."
        />
      ) : (
        <ChartFrame
          label="Spending per site, split into worker payments, contractor payments and expenses"
          height={shown.length * ROW_HEIGHT + CHROME_HEIGHT}
        >
          <BarChart
            data={shown}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
            <XAxis
              type="number"
              tickFormatter={formatCompactAmount}
              tick={CHART_AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={wide ? 150 : 96}
              tickFormatter={(name: string) => truncate(name, wide ? 22 : 12)}
              tick={CHART_AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-surface-muted)' }}
              content={(props) => <MoneyTooltip {...props} showTotal />}
            />
            <Legend {...CHART_LEGEND_PROPS} />
            {OUTFLOW_SERIES.map((series, index) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.label}
                stackId="spend"
                fill={series.color}
                maxBarSize={26}
                radius={index === LAST_SERIES_INDEX ? [0, 4, 4, 0] : 0}
              />
            ))}
          </BarChart>
        </ChartFrame>
      )}
    </SectionCard>
  );
}
