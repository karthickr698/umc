import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  /** Render as a circle, e.g. for avatars. */
  circle?: boolean;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', circle, className }: SkeletonProps) {
  const classes = ['skeleton', circle && 'skeleton--circle', className].filter(Boolean).join(' ');
  return <span className={classes} style={{ width, height }} aria-hidden />;
}
