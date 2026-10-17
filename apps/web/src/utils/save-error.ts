import { ERROR_CODES } from '@umc/shared';
import { ApiClientError } from '@/lib/api-client';
import { describeError } from './describe-error';
import { isValidationIssue, issuesByField } from './validation-issues';

export interface SaveFailure<F extends string> {
  message: string;
  fieldErrors: Partial<Record<F, string>>;
}

/** Conflicts name the clashing fields in `details.fields`, e.g. a site code already in use. */
function conflictFields(details: unknown): string[] {
  if (typeof details !== 'object' || details === null || !('fields' in details)) return [];
  return Array.isArray(details.fields)
    ? details.fields.filter((field): field is string => typeof field === 'string')
    : [];
}

/** Turns a failed create or update into copy for the form, pointing at `fields` where possible. */
export function describeSaveError<F extends string>(
  error: unknown,
  fields: readonly F[],
): SaveFailure<F> {
  if (error instanceof ApiClientError && error.code === ERROR_CODES.VALIDATION_ERROR) {
    const fieldErrors = issuesByField(error.details, fields);
    if (Object.keys(fieldErrors).length > 0) {
      return { message: 'Please correct the highlighted fields.', fieldErrors };
    }
    const issues = Array.isArray(error.details) ? error.details.filter(isValidationIssue) : [];
    return { message: issues[0]?.message ?? error.message, fieldErrors };
  }
  if (error instanceof ApiClientError && error.code === ERROR_CODES.CONFLICT) {
    const fieldErrors: Partial<Record<F, string>> = {};
    for (const name of conflictFields(error.details)) {
      const field = fields.find((candidate) => candidate === name);
      if (field) fieldErrors[field] = error.message;
    }
    return { message: error.message, fieldErrors };
  }
  return { message: describeError(error).message, fieldErrors: {} };
}
