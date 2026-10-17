import type { ReactNode } from 'react';
import { Save } from 'lucide-react';
import { InlineAlert } from '@/components/feedback/inline-alert';
import { Spinner } from '@/components/feedback/spinner';
import type { EntityFormControls } from '@/hooks/use-entity-form';

export interface EntityFormProps {
  form: EntityFormControls;
  submitLabel: string;
  /** Edit forms only submit once something changed; create forms always can. */
  requireChanges?: boolean;
  onCancel: () => void;
  /** Controls shown at the start of the footer, e.g. a delete button. */
  footerStart?: ReactNode;
  children: ReactNode;
}

/** Frame of a create or edit form in a drawer: failure alert, fields, and a sticky footer. */
export function EntityForm({
  form,
  submitLabel,
  requireChanges = false,
  onCancel,
  footerStart,
  children,
}: EntityFormProps) {
  const { dirty, failure, dismissFailure, saving, handleSubmit } = form;

  return (
    <form className="entity-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="entity-form__fields">
        {failure && (
          <InlineAlert tone="error" title="Could not save" onDismiss={dismissFailure}>
            {failure}
          </InlineAlert>
        )}
        {children}
      </div>

      <footer className="entity-form__footer">
        {footerStart}
        <div className="entity-form__primary">
          <button type="button" className="button" disabled={saving} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="button button--primary"
            disabled={saving || (requireChanges && !dirty)}
          >
            {saving ? <Spinner size={16} label="Saving" /> : <Save size={16} aria-hidden />}
            {submitLabel}
          </button>
        </div>
      </footer>
    </form>
  );
}
