import { Pencil } from 'lucide-react';
import { ConfirmButton } from '@/components/forms/confirm-button';

export interface RowActionsProps {
  /** Names the record for screen readers, e.g. "client Asha Builders". */
  itemLabel: string;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function RowActions({ itemLabel, deleting, onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="row-actions">
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
      <ConfirmButton
        className="button--small"
        label="Delete"
        confirmLabel="Confirm"
        title={`Delete ${itemLabel}`}
        pending={deleting}
        pendingLabel="Deleting"
        onConfirm={onDelete}
      />
    </div>
  );
}
