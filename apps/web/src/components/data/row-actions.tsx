import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/feedback/spinner';

export interface RowActionsProps {
  /** Names the record for screen readers, e.g. "client Asha Builders". */
  itemLabel: string;
  deleting?: boolean;
  /** Each action is shown only when its handler is given. */
  onView?: () => void;
  onEdit?: () => void;
  /** Should ask for confirmation before deleting, e.g. with a `ConfirmDialog`. */
  onDelete?: () => void;
}

export function RowActions({
  itemLabel,
  deleting = false,
  onView,
  onEdit,
  onDelete,
}: RowActionsProps) {
  return (
    <div className="row-actions">
      {onView && (
        <button
          type="button"
          className="button button--small"
          title={`View ${itemLabel}`}
          onClick={onView}
        >
          <Eye size={14} aria-hidden />
          View
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          className="button button--small"
          title={`Edit ${itemLabel}`}
          disabled={deleting}
          onClick={onEdit}
        >
          <Pencil size={14} aria-hidden />
          Edit
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="button button--small button--ghost button--ghost-danger"
          title={`Delete ${itemLabel}`}
          disabled={deleting}
          onClick={onDelete}
        >
          {deleting ? <Spinner size={14} label="Deleting" /> : <Trash2 size={14} aria-hidden />}
          Delete
        </button>
      )}
    </div>
  );
}
