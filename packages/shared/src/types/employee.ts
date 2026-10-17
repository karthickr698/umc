import type { EmployeeStatus } from '../constants/domain.js';

/** The new employee always belongs to the caller's company. */
export interface CreateEmployeeRequest {
  name: string;
  phone?: string;
  /** Unique within the company; stored upper-cased. Assigned by the server when omitted. */
  employeeCode?: string;
  role: string;
  dailyRate: number;
  status?: EmployeeStatus;
  notes?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  phone?: string;
  employeeCode?: string;
  role?: string;
  dailyRate?: number;
  status?: EmployeeStatus;
  notes?: string;
}

export interface ListEmployeesQuery {
  page?: number;
  pageSize?: number;
  status?: EmployeeStatus;
  /** Case-insensitive match on name, employee code, phone or role. */
  search?: string;
}
