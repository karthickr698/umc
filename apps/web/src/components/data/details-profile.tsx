import type { ReactNode } from 'react';
import { Pencil } from 'lucide-react';
import { initials } from '@/utils/format';

export interface DetailsProfileProps {
  name: string;
  /** Content of the round badge, e.g. an icon; defaults to the name's initials. */
  avatar?: ReactNode;
  /** Short facts under the name, e.g. a status badge and a "since" date. */
  meta?: ReactNode;
  /** Shows an Edit button when given. */
  onEdit?: () => void;
}

/** The avatar, name and key facts at the top of a details view. */
export function DetailsProfile({ name, avatar, meta, onEdit }: DetailsProfileProps) {
  return (
    <header className="details__profile">
      <span className="details__avatar" aria-hidden>
        {avatar ?? initials(name)}
      </span>
      <div className="details__identity">
        <h3 className="details__name">{name}</h3>
        {meta && <div className="details__meta">{meta}</div>}
      </div>
      {onEdit && (
        <button
          type="button"
          className="button button--primary details__edit"
          title={`Edit ${name}`}
          onClick={onEdit}
        >
          <Pencil size={16} aria-hidden />
          Edit
        </button>
      )}
    </header>
  );
}
