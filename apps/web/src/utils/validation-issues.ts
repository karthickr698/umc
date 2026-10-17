import type { ValidationIssue } from '@umc/shared';

export function isValidationIssue(value: unknown): value is ValidationIssue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    typeof value.path === 'string' &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

/** First message per form field from a `VALIDATION_ERROR`'s `details`; other paths are dropped. */
export function issuesByField<F extends string>(
  details: unknown,
  fields: readonly F[],
): Partial<Record<F, string>> {
  const errors: Partial<Record<F, string>> = {};
  if (!Array.isArray(details)) return errors;
  for (const issue of details) {
    if (!isValidationIssue(issue)) continue;
    const field = fields.find((name) => name === issue.path);
    if (field) errors[field] ??= issue.message;
  }
  return errors;
}
