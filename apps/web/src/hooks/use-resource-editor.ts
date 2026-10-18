import { useCallback, useState } from 'react';
import { deleteResource, type ResourceApi } from '@/lib/resource-api';
import { describeError } from '@/utils/describe-error';
import { useResourceMutation } from './use-resource-mutation';
import { useToast } from './use-toast';

/** The drawer's content: a record's details, its edit form, the add form, or nothing. */
export type ResourceEditor<T> =
  { mode: 'view'; item: T } | { mode: 'edit'; item: T } | { mode: 'create' } | null;

/** A record the user asked to delete, waiting for them to confirm. */
export interface PendingDelete<T> {
  item: T;
  /** e.g. `client "Asha Builders"`. */
  name: string;
  error?: string;
}

/** The open drawer, the delete being confirmed, and toasts for the outcome of each change. */
export function useResourceEditor<T extends { id: string }>(
  api: ResourceApi,
  initialEditor: ResourceEditor<T> = null,
) {
  const { showToast } = useToast();
  const [editor, setEditor] = useState<ResourceEditor<T>>(initialEditor);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete<T> | null>(null);
  const remove = useResourceMutation((id: string) => deleteResource(api, id));
  const openCreate = useCallback(() => setEditor({ mode: 'create' }), []);

  const confirmDelete = () => {
    if (!pendingDelete || remove.isPending) return;
    const { item, name } = pendingDelete;
    setPendingDelete({ item, name });
    remove.mutate(item.id, {
      onSuccess: () => {
        setPendingDelete(null);
        setEditor((current) =>
          current && 'item' in current && current.item.id === item.id ? null : current,
        );
        showToast({ title: 'Deleted', message: `Deleted ${name}.` });
      },
      onError: (error) => setPendingDelete({ item, name, error: describeError(error).message }),
    });
  };

  const handleSaved = (name: string, created: boolean) => {
    showToast({
      title: created ? 'Added' : 'Saved',
      message: `${created ? 'Added' : 'Saved'} ${name}.`,
    });
    setEditor(null);
  };

  return {
    editor,
    openCreate,
    openView: (item: T) => setEditor({ mode: 'view', item }),
    openEdit: (item: T) => setEditor({ mode: 'edit', item }),
    closeEditor: () => setEditor(null),
    pendingDelete,
    deleting: remove.isPending,
    requestDelete: (item: T, name: string) => setPendingDelete({ item, name }),
    cancelDelete: () => {
      if (!remove.isPending) setPendingDelete(null);
    },
    confirmDelete,
    deletingId: remove.isPending ? remove.variables : undefined,
    handleSaved,
  };
}
