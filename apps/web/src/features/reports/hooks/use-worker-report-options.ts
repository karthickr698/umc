import type { ContractorDto, ContractorEmployeeDto, EmployeeDto } from '@umc/shared';
import { useAllPagesSelectOptions } from '@/hooks/use-select-options';
import { employeeOption, namedOption } from '@/lib/select-options';
import { REPORTS_API } from '../reports-api';
import { useReportSiteOptions } from './use-report-site-options';

/**
 * Choices for the report's site, employee, contractor and contractor employee filters. With
 * `contractorId`, only that contractor's employees are offered.
 */
export function useWorkerReportOptions(contractorId: string) {
  return {
    sites: useReportSiteOptions(),
    employees: useAllPagesSelectOptions<EmployeeDto>(REPORTS_API.employees, employeeOption),
    contractors: useAllPagesSelectOptions<ContractorDto>(REPORTS_API.contractors, namedOption),
    contractorEmployees: useAllPagesSelectOptions<ContractorEmployeeDto>(
      REPORTS_API.contractorEmployees,
      employeeOption,
      { contractorId: contractorId || undefined },
    ),
  };
}
