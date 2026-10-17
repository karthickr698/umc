import { useMemo } from 'react';
import { ChartLine } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { TREND_INTERVALS, type DashboardTrend } from '@umc/shared';
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
import { formatCompactAmount } from '@/utils/format';
import type { DateRange } from '@/lib/date-presets';
import { MONEY_SERIES, OUTFLOW_SERIES } from '../lib/money-series';
import { fillTrendGaps, formatPeriod, formatPeriodTick } from '../lib/trend-series';

const TREND_SERIES = [MONEY_SERIES.clientPaymentsReceived, ...OUTFLOW_SERIES] as const;

export interface PaymentTrendChartProps {
  trend: DashboardTrend;
  range: DateRange;
}

/** Money received against each kind of money paid out, per day or per month. */
export function PaymentTrendChart({ trend, range }: PaymentTrendChartProps) {
  const wide = useMediaQuery(TABLET_MEDIA_QUERY);
  const { interval } = trend;
  const { from, to } = range;
  const points = useMemo(() => fillTrendGaps(trend, { from, to }), [trend, from, to]);
  const hasData = points.some((point) => TREND_SERIES.some((series) => point[series.key] > 0));

  return (
    <SectionCard
      title="Payment trend"
      description={
        interval === TREND_INTERVALS.DAY
          ? 'Money received and paid out per day.'
          : 'Money received and paid out per month.'
      }
    >
      {hasData ? (
        <ChartFrame
          label="Client receipts, worker payments, contractor payments and expenses over time"
          height={wide ? 320 : 260}
        >
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
            <XAxis
              dataKey="period"
              tickFormatter={(period: string) => formatPeriodTick(period, interval)}
              tick={CHART_AXIS_TICK}
              minTickGap={24}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCompactAmount}
              tick={CHART_AXIS_TICK}
              width={48}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={(props) => (
                <MoneyTooltip {...props} formatLabel={(period) => formatPeriod(period, interval)} />
              )}
            />
            <Legend {...CHART_LEGEND_PROPS} />
            {TREND_SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                strokeWidth={2}
                // A single bucket has no line to draw, so show its points instead.
                dot={points.length === 1}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ChartFrame>
      ) : (
        <EmptyState
          compact
          icon={ChartLine}
          title="No payments yet"
          message="No money was received or paid out for these filters."
        />
      )}
    </SectionCard>
  );
}
