import { ERROR_CODES, type SiteDto } from '@umc/shared';
import { ApiClientError } from '@/lib/api-client';
import { siteLabel } from '@/lib/sites';
import { describeError } from '@/utils/describe-error';
import { issuesByField } from '@/utils/validation-issues';
import { EDIT_ASSIGNMENT_FIELDS, type EditAssignmentErrors } from './edit-assignment-form';

export interface EditAssignmentFailure {
  message: string;
  fieldErrors: EditAssignmentErrors;
}

function conflictSiteId(details: unknown): string | undefined {
  if (typeof details !== 'object' || details === null || !('siteId' in details)) return undefined;
  return typeof details.siteId === 'string' ? details.siteId : undefined;
}

/** Turns a failed save into copy for the form, pointing at the offending field where possible. */
export function describeEditError(
  error: unknown,
  sitesById: ReadonlyMap<string, SiteDto>,
): EditAssignmentFailure {
  if (error instanceof ApiClientError && error.code === ERROR_CODES.VALIDATION_ERROR) {
    return {
      message: 'Please correct the highlighted fields.',
      fieldErrors: issuesByField(error.details, EDIT_ASSIGNMENT_FIELDS),
    };
  }
  if (error instanceof ApiClientError && error.code === ERROR_CODES.CONFLICT) {
    const siteId = conflictSiteId(error.details);
    const where = siteId ? ` at ${siteLabel(sitesById.get(siteId))}` : '';
    const message = `This worker already works${where} on that day.`;
    return { message, fieldErrors: { date: message } };
  }
  return { message: describeError(error).message, fieldErrors: {} };
}
