import type { ContractorEmployeeStatus } from '../constants/domain.js';

/**
 * The new contractor employee always belongs to the caller's company; `contractorId` must be in
 * the same company.
 */
export interface CreateContractorEmployeeRequest {
  contractorId: string;
  name: string;
  phone?: string;
  /** Unique per contractor; stored upper-cased. Assigned by the server when omitted. */
  employeeCode?: string;
  /** Defaults to 0; work assignments can set their own rate. */
  dailyRate?: number;
  status?: ContractorEmployeeStatus;
}

export interface UpdateContractorEmployeeRequest {
  /** Moves the employee to another contractor in the same company. */
  contractorId?: string;
  name?: string;
  phone?: string;
  employeeCode?: string;
  dailyRate?: number;
  status?: ContractorEmployeeStatus;
}

export interface ListContractorEmployeesQuery {
  page?: number;
  pageSize?: number;
  contractorId?: string;
  status?: ContractorEmployeeStatus;
  /** Case-insensitive match on name, employee code or phone. */
  search?: string;
}
