import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import type { PendingDelete } from '@/hooks/use-resource-editor';

export interface ResourceDeleteDialogProps<T> {
  /** Singular, lower-case, e.g. "client". */
  noun: string;
  pendingDelete: PendingDelete<T> | null;
  itemName: (item: T) => string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Asks the user to confirm deleting the record in `pendingDelete`, and shows why it failed. */
export function ResourceDeleteDialog<T>({
  noun,
  pendingDelete,
  itemName,
  deleting,
  onConfirm,
  onCancel,
}: ResourceDeleteDialogProps<T>) {
  return (
    <ConfirmDialog
      open={pendingDelete !== null}
      title={`Delete this ${noun}?`}
      confirmLabel={`Delete ${noun}`}
      pending={deleting}
      pendingLabel="Deleting"
      error={
        pendingDelete?.error
          ? { title: `Could not delete ${noun}`, message: pendingDelete.error }
          : undefined
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {pendingDelete && (
        <p>
          <strong>{itemName(pendingDelete.item)}</strong> will be permanently removed. This cannot
          be undone.
        </p>
      )}
    </ConfirmDialog>
  );
}
