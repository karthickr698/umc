import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

export interface ChartFrameProps {
  /** Describes what the chart shows, for assistive technology. */
  label: string;
  /** CSS height; the width always fills the container. */
  height: number | string;
  children: ReactElement;
}

/** Sizes a Recharts chart to its container so it reflows on any screen width. */
export function ChartFrame({ label, height, children }: ChartFrameProps) {
  return (
    <div className="chart-frame" role="figure" aria-label={label} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
