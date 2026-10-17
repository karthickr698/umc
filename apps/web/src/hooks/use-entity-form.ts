import { useState, type FormEvent } from 'react';
import { hasErrors, type Draft, type DraftErrors } from '@/lib/form-draft';
import { describeSaveError } from '@/utils/save-error';
import { useResourceMutation } from './use-resource-mutation';

export interface EntityFormOptions<D extends Draft, R> {
  initial: D;
  /** Mirrors the API's checks so most mistakes are caught before a request is sent. */
  validate: (draft: D) => DraftErrors<D>;
  submit: (draft: D) => Promise<R>;
  onSaved: (saved: R) => void;
}

/** Props that wire one draft field to a text or select field component. */
export interface BoundField {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

/**
 * Draft state, client-side validation and submission of a create or edit form. Server-side
 * validation and conflict errors are mapped back onto the draft's fields.
 */
export function useEntityForm<D extends Draft, R>({
  initial,
  validate,
  submit,
  onSaved,
}: EntityFormOptions<D, R>) {
  const [draft, setDraft] = useState<D>(initial);
  const [errors, setErrors] = useState<DraftErrors<D>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const mutation = useResourceMutation(submit);

  const fields = Object.keys(initial) as (keyof D & string)[];
  const dirty = fields.some((field) => draft[field] !== initial[field]);

  const set = (field: keyof D & string, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const bind = (field: keyof D & string): BoundField => ({
    value: draft[field] ?? '',
    error: errors[field],
    onChange: (value) => set(field, value),
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (mutation.isPending) return;
    const problems = validate(draft);
    setErrors(problems);
    if (hasErrors(problems)) return;

    setFailure(null);
    try {
      onSaved(await mutation.mutateAsync(draft));
    } catch (error) {
      const described = describeSaveError(error, fields);
      setFailure(described.message);
      setErrors(described.fieldErrors);
    }
  };

  return {
    draft,
    errors,
    set,
    bind,
    dirty,
    failure,
    dismissFailure: () => setFailure(null),
    saving: mutation.isPending,
    handleSubmit,
  } satisfies EntityFormControls & Record<string, unknown>;
}

/** The parts of `useEntityForm` that the form frame (alert and footer) needs. */
export interface EntityFormControls {
  dirty: boolean;
  failure: string | null;
  dismissFailure: () => void;
  saving: boolean;
  handleSubmit: (event: FormEvent) => Promise<void>;
}
