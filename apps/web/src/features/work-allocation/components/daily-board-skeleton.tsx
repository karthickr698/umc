import { Skeleton } from '@/components/feedback/skeleton';

const PLACEHOLDER_GROUPS = ['first', 'second'] as const;
const PLACEHOLDER_ROWS = ['a', 'b', 'c'] as const;

export function DailyBoardSkeleton() {
  return (
    <div className="daily-board" aria-hidden>
      {PLACEHOLDER_GROUPS.map((group) => (
        <div key={group} className="site-group">
          <Skeleton width="40%" height="1.25rem" />
          {PLACEHOLDER_ROWS.map((row) => (
            <Skeleton key={row} height="2.5rem" />
          ))}
        </div>
      ))}
    </div>
  );
}
