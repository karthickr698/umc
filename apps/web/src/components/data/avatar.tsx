import { getInitials } from '@/utils/format';

export interface AvatarProps {
  name: string;
  size?: 'small' | 'medium';
  /** Greys the avatar out, e.g. for an inactive or unavailable person. */
  muted?: boolean;
}

/** A round badge with a person's initials; decorative, so the name must be shown alongside. */
export function Avatar({ name, size = 'medium', muted = false }: AvatarProps) {
  const classes = ['avatar', `avatar--${size}`, muted && 'avatar--muted'].filter(Boolean).join(' ');
  return (
    <span className={classes} aria-hidden>
      {getInitials(name)}
    </span>
  );
}
