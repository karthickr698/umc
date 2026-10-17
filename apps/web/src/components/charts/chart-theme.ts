/** Recharts styling shared by every chart so axes, grids and legends look alike. */
export const CHART_AXIS_TICK = { fontSize: 12, fill: 'var(--color-muted)' } as const;

export const CHART_GRID_STROKE = 'var(--color-border)';

export const CHART_LEGEND_PROPS = {
  iconType: 'circle',
  iconSize: 8,
  wrapperStyle: { fontSize: 13, paddingTop: 8 },
} as const;
