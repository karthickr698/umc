import {
  EMPLOYEE_LIMITS,
  FIELD_LIMITS,
  type UpdateWorkAssignmentRequest,
  type WorkAssignmentDto,
  type WorkAssignmentStatus,
} from '@umc/shared';
import { isCalendarDate } from '@/utils/calendar-date';

export const EDIT_ASSIGNMENT_FIELDS = [
  'date',
  'siteId',
  'workType',
  'dailyRate',
  'status',
  'notes',
] as const;

export type EditAssignmentField = (typeof EDIT_ASSIGNMENT_FIELDS)[number];

export type EditAssignmentErrors = Partial<Record<EditAssignmentField, string>>;

/** Form values as typed; `dailyRate` stays a string so the input can be cleared while editing. */
export interface EditAssignmentDraft {
  date: string;
  siteId: string;
  workType: string;
  dailyRate: string;
  status: WorkAssignmentStatus;
  notes: string;
}

export function toEditDraft(assignment: WorkAssignmentDto): EditAssignmentDraft {
  return {
    date: assignment.date,
    siteId: assignment.siteId,
    workType: assignment.workType,
    dailyRate: String(assignment.dailyRate),
    status: assignment.status,
    notes: assignment.notes ?? '',
  };
}

/** Mirrors the update endpoint's checks so most mistakes are caught before a request is sent. */
export function validateEditDraft(draft: EditAssignmentDraft): EditAssignmentErrors {
  const errors: EditAssignmentErrors = {};
  if (!isCalendarDate(draft.date)) errors.date = 'Enter a valid date';
  if (!draft.siteId) errors.siteId = 'Choose a site';

  const workType = draft.workType.trim();
  if (!workType) errors.workType = 'Work type is required';
  else if (workType.length > FIELD_LIMITS.workType) {
    errors.workType = `Use at most ${FIELD_LIMITS.workType} characters`;
  }

  const rate = Number(draft.dailyRate);
  if (draft.dailyRate.trim() === '' || !Number.isFinite(rate)) {
    errors.dailyRate = 'Enter a daily rate';
  } else if (rate < 0 || rate > EMPLOYEE_LIMITS.maxDailyRate) {
    errors.dailyRate = `Enter an amount between 0 and ${EMPLOYEE_LIMITS.maxDailyRate}`;
  }

  if (draft.notes.trim().length > FIELD_LIMITS.notes) {
    errors.notes = `Use at most ${FIELD_LIMITS.notes} characters`;
  }
  return errors;
}

/** Only the fields that differ from `assignment`; empty when nothing changed. */
export function toUpdateRequest(
  assignment: WorkAssignmentDto,
  draft: EditAssignmentDraft,
): UpdateWorkAssignmentRequest {
  const changes: UpdateWorkAssignmentRequest = {};
  const workType = draft.workType.trim();
  const dailyRate = Number(draft.dailyRate);
  const notes = draft.notes.trim();

  if (draft.date !== assignment.date) changes.date = draft.date;
  if (draft.siteId !== assignment.siteId) changes.siteId = draft.siteId;
  if (workType !== assignment.workType) changes.workType = workType;
  if (dailyRate !== assignment.dailyRate) changes.dailyRate = dailyRate;
  if (draft.status !== assignment.status) changes.status = draft.status;
  if (notes !== (assignment.notes ?? '')) changes.notes = notes;
  return changes;
}
