import { useId, useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import {
  EMPLOYEE_LIMITS,
  FIELD_LIMITS,
  WORK_ASSIGNMENT_STATUSES,
  type SiteDto,
  type WorkAssignmentDto,
  type WorkAssignmentStatus,
} from '@umc/shared';
import { InlineAlert } from '@/components/feedback/inline-alert';
import { Spinner } from '@/components/feedback/spinner';
import { ConfirmButton } from '@/components/forms/confirm-button';
import { DateField } from '@/components/forms/date-field';
import { FormField } from '@/components/forms/form-field';
import { SelectField, type SelectOption } from '@/components/forms/select-field';
import { humanizeEnum } from '@/utils/format';
import { useAssignmentEditor } from '../hooks/use-assignment-editor';
import { describeEditError } from '../lib/edit-assignment-error';
import {
  toEditDraft,
  toUpdateRequest,
  validateEditDraft,
  type EditAssignmentDraft,
  type EditAssignmentErrors,
} from '../lib/edit-assignment-form';

const STATUS_OPTIONS: readonly SelectOption[] = Object.values(WORK_ASSIGNMENT_STATUSES).map(
  (status) => ({ value: status, label: humanizeEnum(status) }),
);

const isStatus = (value: string): value is WorkAssignmentStatus =>
  Object.values<string>(WORK_ASSIGNMENT_STATUSES).includes(value);

export interface EditAssignmentFormProps {
  assignment: WorkAssignmentDto;
  siteOptions: readonly SelectOption[];
  sitesById: ReadonlyMap<string, SiteDto>;
  workTypeSuggestions: readonly string[];
  onSaved: (updated: WorkAssignmentDto) => void;
  onRemoved: () => void;
  onCancel: () => void;
}

/** Completed days are kept as attendance, so only scheduled or cancelled ones can be removed. */
export function EditAssignmentForm({
  assignment,
  siteOptions,
  sitesById,
  workTypeSuggestions,
  onSaved,
  onRemoved,
  onCancel,
}: EditAssignmentFormProps) {
  const { update, remove } = useAssignmentEditor();
  const [draft, setDraft] = useState<EditAssignmentDraft>(() => toEditDraft(assignment));
  const [errors, setErrors] = useState<EditAssignmentErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const changes = toUpdateRequest(assignment, draft);
  const dirty = Object.keys(changes).length > 0;
  const busy = update.isPending || remove.isPending;
  const removable = assignment.status !== WORK_ASSIGNMENT_STATUSES.COMPLETED;
  const listId = useId();

  const set = <K extends keyof EditAssignmentDraft>(key: K, value: EditAssignmentDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !dirty) return;
    const problems = validateEditDraft(draft);
    setErrors(problems);
    if (Object.values(problems).some(Boolean)) return;

    setFailure(null);
    try {
      onSaved(await update.mutateAsync({ id: assignment.id, changes }));
    } catch (error) {
      const described = describeEditError(error, sitesById);
      setFailure(described.message);
      setErrors(described.fieldErrors);
    }
  };

  const handleRemove = async () => {
    setFailure(null);
    try {
      await remove.mutateAsync(assignment.id);
      onRemoved();
    } catch (error) {
      setFailure(describeEditError(error, sitesById).message);
    }
  };

  return (
    <form className="entity-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="entity-form__fields">
        {failure && (
          <InlineAlert tone="error" title="Could not save" onDismiss={() => setFailure(null)}>
            {failure}
          </InlineAlert>
        )}

        <div className="entity-form__row">
          <DateField
            label="Date"
            required
            error={errors.date}
            value={draft.date}
            onChange={(day) => set('date', day)}
          />
          <SelectField
            label="Status"
            value={draft.status}
            options={STATUS_OPTIONS}
            error={errors.status}
            onChange={(value) => {
              if (isStatus(value)) set('status', value);
            }}
          />
        </div>

        <SelectField
          label="Site"
          placeholder="Choose a site"
          value={draft.siteId}
          options={siteOptions}
          error={errors.siteId}
          onChange={(value) => set('siteId', value)}
        />

        <div className="entity-form__row">
          <FormField label="Work type" error={errors.workType}>
            {(control) => (
              <>
                <input
                  {...control}
                  className="field__input"
                  list={listId}
                  required
                  maxLength={FIELD_LIMITS.workType}
                  value={draft.workType}
                  onChange={(event) => set('workType', event.target.value)}
                />
                <datalist id={listId}>
                  {workTypeSuggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              </>
            )}
          </FormField>
          <FormField label="Daily rate" error={errors.dailyRate}>
            {(control) => (
              <input
                {...control}
                type="number"
                inputMode="decimal"
                min={0}
                max={EMPLOYEE_LIMITS.maxDailyRate}
                step={EMPLOYEE_LIMITS.dailyRateStep}
                required
                className="field__input"
                value={draft.dailyRate}
                onChange={(event) => set('dailyRate', event.target.value)}
              />
            )}
          </FormField>
        </div>

        <FormField label="Notes" error={errors.notes}>
          {(control) => (
            <textarea
              {...control}
              rows={3}
              maxLength={FIELD_LIMITS.notes}
              className="field__input field__input--multiline"
              placeholder="Optional"
              value={draft.notes}
              onChange={(event) => set('notes', event.target.value)}
            />
          )}
        </FormField>
      </div>

      <footer className="entity-form__footer">
        {removable && (
          <ConfirmButton
            label="Remove"
            confirmLabel="Confirm remove"
            pending={remove.isPending}
            pendingLabel="Removing"
            disabled={busy}
            onConfirm={() => void handleRemove()}
          />
        )}
        <div className="entity-form__primary">
          <button type="button" className="button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="button button--primary" disabled={busy || !dirty}>
            {update.isPending ? (
              <Spinner size={16} label="Saving" />
            ) : (
              <Save size={16} aria-hidden />
            )}
            Save changes
          </button>
        </div>
      </footer>
    </form>
  );
}
