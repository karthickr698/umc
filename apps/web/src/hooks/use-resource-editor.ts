import { useState } from 'react';
import { deleteResource, type ResourceApi } from '@/lib/resource-api';
import { describeError } from '@/utils/describe-error';
import { useResourceMutation } from './use-resource-mutation';

/** Outcome of the last save or delete, shown above the list. */
export interface ResourceNotice {
  tone: 'success' | 'error';
  message: string;
}

/** `{ item }` while editing, `{}` while adding, `null` when the form is closed. */
export type ResourceEditor<T> = { item?: T } | null;

/** The open add/edit form, the delete in flight, and the outcome of the last change. */
export function useResourceEditor<T extends { id: string }>(api: ResourceApi) {
  const [editor, setEditor] = useState<ResourceEditor<T>>(null);
  const [notice, setNotice] = useState<ResourceNotice | null>(null);
  const remove = useResourceMutation((id: string) => deleteResource(api, id));

  const handleDelete = (item: T, name: string) => {
    setNotice(null);
    remove.mutate(item.id, {
      onSuccess: () => setNotice({ tone: 'success', message: `Deleted ${name}.` }),
      onError: (error) => setNotice({ tone: 'error', message: describeError(error).message }),
    });
  };

  const handleSaved = (name: string) => {
    setNotice({ tone: 'success', message: `Saved ${name}.` });
    setEditor(null);
  };

  return {
    editor,
    openCreate: () => setEditor({}),
    openEdit: (item: T) => setEditor({ item }),
    closeEditor: () => setEditor(null),
    notice,
    dismissNotice: () => setNotice(null),
    deletingId: remove.isPending ? remove.variables : undefined,
    handleDelete,
    handleSaved,
  };
}
