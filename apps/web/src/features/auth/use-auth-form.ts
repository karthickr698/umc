import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';
import type { AuthFailure } from './auth-error';
import { type FieldErrors, hasErrors } from './auth-validation';

export interface FormAlert {
  message: string;
  requestId?: string;
}

type StringFields<V> = { [K in keyof V]: string };

export interface UseAuthFormOptions<V extends StringFields<V>> {
  /** Key order is the focus order when moving to the first invalid field. */
  initialValues: V;
  validate: (values: V) => FieldErrors<keyof V & string>;
  /** On success the session changes and the guest-only route redirects away. */
  submit: (values: V) => Promise<void>;
  describeError: (error: unknown) => AuthFailure<keyof V & string>;
}

/** Form state shared by the sign-in and sign-up forms. */
export function useAuthForm<V extends StringFields<V>>({
  initialValues,
  validate,
  submit,
  describeError,
}: UseAuthFormOptions<V>) {
  type Field = keyof V & string;

  const [values, setValues] = useState<V>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({});
  const [alert, setAlert] = useState<FormAlert | null>(null);
  // Validate as the user types only after the first submit, so errors don't nag mid-entry.
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef(new Map<Field, HTMLInputElement>());
  const fieldOrder = Object.keys(initialValues) as Field[];

  const focusFirst = (fields: readonly Field[]) => {
    const target = fieldOrder.find((name) => fields.includes(name));
    if (target) inputs.current.get(target)?.focus();
  };

  const invalidFields = (errors: FieldErrors<Field>) => fieldOrder.filter((name) => errors[name]);

  /** Props to spread onto the input bound to `name`. */
  const field = (name: Field) => ({
    name,
    value: values[name],
    ref: (element: HTMLInputElement | null) => {
      if (element) inputs.current.set(name, element);
      else inputs.current.delete(name);
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [name]: event.target.value };
      setValues(next);
      if (attempted) setFieldErrors(validate(next));
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setAttempted(true);
    setAlert(null);
    const errors = validate(values);
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      focusFirst(invalidFields(errors));
      return;
    }

    setSubmitting(true);
    try {
      await submit(values);
    } catch (error) {
      const failure = describeError(error);
      const cleared = failure.clearFields ?? [];
      setAlert({ message: failure.message, requestId: failure.requestId });
      setFieldErrors(failure.fieldErrors);
      setSubmitting(false);
      if (cleared.length > 0) {
        setValues((current) => ({
          ...current,
          ...Object.fromEntries(cleared.map((name) => [name, ''])),
        }));
      }
      // Wait for the fieldset to be re-enabled before moving focus.
      requestAnimationFrame(() =>
        focusFirst(cleared.length > 0 ? cleared : invalidFields(failure.fieldErrors)),
      );
    }
  };

  return {
    fieldErrors,
    alert,
    submitting,
    field,
    onSubmit: (event: FormEvent<HTMLFormElement>) => void handleSubmit(event),
  };
}
