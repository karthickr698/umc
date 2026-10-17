import { useMemo } from 'react';
import type { ContractorEmployeeDto, EmployeeDto, SiteDto, WorkAssignmentDto } from '@umc/shared';
import type { ApiQuery } from '@/hooks/use-api-query';
import { useAllPagesQuery } from '@/hooks/use-all-pages-query';
import { isAssignableSite } from '@/lib/sites';
import { toWorkers, type AllocationWorker } from '../lib/workers';
import { WORK_ALLOCATION_API } from '../work-allocation-api';

/** Sites and workers; independent of the chosen day. */
export interface AllocationReference {
  sitesById: ReadonlyMap<string, SiteDto>;
  assignableSites: SiteDto[];
  workers: AllocationWorker[];
  workersByKey: ReadonlyMap<string, AllocationWorker>;
}

function buildReference(
  sites: SiteDto[],
  employees: EmployeeDto[],
  contractorEmployees: ContractorEmployeeDto[],
): AllocationReference {
  const workers = toWorkers(employees, contractorEmployees);
  return {
    sitesById: new Map(sites.map((site) => [site.id, site])),
    assignableSites: sites.filter(isAssignableSite),
    workers,
    workersByKey: new Map(workers.map((worker) => [worker.key, worker])),
  };
}

export interface AllocationData {
  reference: ApiQuery<AllocationReference>;
  /** Every assignment on `date`, whatever its status. */
  daily: ApiQuery<WorkAssignmentDto[]>;
}

export function useAllocationData(date: string): AllocationData {
  const sites = useAllPagesQuery<SiteDto>(WORK_ALLOCATION_API.sites);
  const employees = useAllPagesQuery<EmployeeDto>(WORK_ALLOCATION_API.employees);
  const contractorEmployees = useAllPagesQuery<ContractorEmployeeDto>(
    WORK_ALLOCATION_API.contractorEmployees,
  );
  const daily = useAllPagesQuery<WorkAssignmentDto>(WORK_ALLOCATION_API.daily(date));

  const referenceData = useMemo(
    () =>
      sites.data && employees.data && contractorEmployees.data
        ? buildReference(sites.data, employees.data, contractorEmployees.data)
        : undefined,
    [sites.data, employees.data, contractorEmployees.data],
  );

  const parts = [sites, employees, contractorEmployees];
  const reference: ApiQuery<AllocationReference> = {
    data: referenceData,
    error: parts.find((part) => part.error !== undefined)?.error,
    loading: parts.some((part) => part.loading),
    retry: () => {
      for (const part of parts) if (part.error !== undefined) part.retry();
    },
  };

  return { reference, daily };
}
