import {
  API_ROUTES,
  type BulkCreateWorkAssignmentsRequest,
  type BulkCreateWorkAssignmentsResult,
  type UpdateWorkAssignmentRequest,
  type WorkAssignmentDto,
} from '@umc/shared';
import { apiRequest } from '@/lib/api-client';

const { workAssignments, sites, employees, contractorEmployees } = API_ROUTES;

const withParam = (path: string, param: string, value: string) =>
  path.replace(`:${param}`, encodeURIComponent(value));

/** API paths used by work allocation, relative to the API base URL. */
export const WORK_ALLOCATION_API = {
  sites: sites.base,
  employees: employees.base,
  employee: (id: string) => `${employees.base}${withParam(employees.byId, 'id', id)}`,
  contractorEmployees: contractorEmployees.base,
  contractorEmployee: (id: string) =>
    `${contractorEmployees.base}${withParam(contractorEmployees.byId, 'id', id)}`,
  /** The list endpoint; also the prefix of every work-assignment path. */
  assignments: workAssignments.base,
  daily: (date: string) =>
    `${workAssignments.base}${withParam(workAssignments.daily, 'date', date)}`,
  byWorker: (workerId: string) =>
    `${workAssignments.base}${withParam(workAssignments.byWorker, 'workerId', workerId)}`,
  bulk: `${workAssignments.base}${workAssignments.bulk}`,
  byId: (id: string) => `${workAssignments.base}${withParam(workAssignments.byId, 'id', id)}`,
};

export function bulkAssign(
  request: BulkCreateWorkAssignmentsRequest,
): Promise<BulkCreateWorkAssignmentsResult> {
  return apiRequest(WORK_ALLOCATION_API.bulk, { method: 'POST', body: JSON.stringify(request) });
}

export function updateAssignment(
  id: string,
  changes: UpdateWorkAssignmentRequest,
): Promise<WorkAssignmentDto> {
  return apiRequest(WORK_ALLOCATION_API.byId(id), {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export function deleteAssignment(id: string): Promise<void> {
  return apiRequest(WORK_ALLOCATION_API.byId(id), { method: 'DELETE' });
}
