import { ROSTER_STATE_LABELS, ROSTER_STATES, type RosterState } from '../lib/roster';

const TONES: Readonly<Record<RosterState, string>> = {
  [ROSTER_STATES.ASSIGNED]: 'ok',
  [ROSTER_STATES.ELSEWHERE]: 'neutral',
  [ROSTER_STATES.UNASSIGNED]: 'warn',
};

export function RosterStateBadge({ state }: { state: RosterState }) {
  return (
    <span className={`badge badge--${TONES[state]} roster-state`}>
      <span className="roster-state__dot" aria-hidden />
      {ROSTER_STATE_LABELS[state]}
    </span>
  );
}
