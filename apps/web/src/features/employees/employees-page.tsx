import { Users } from 'lucide-react';
import { EMPLOYEE_STATUSES, type EmployeeDto } from '@umc/shared';
import type { DataTableColumn } from '@/components/data/data-table';
import { StackedCell } from '@/components/data/stacked-cell';
import { StatusBadge } from '@/components/data/status-badge';
import { ResourceListPage } from '@/components/pages/resource-list-page';
import { useCan } from '@/hooks/use-can';
import { RESOURCE_API } from '@/lib/resource-api';
import { employeeOption } from '@/lib/select-options';
import { formatAmount } from '@/utils/format';
import { EmployeeForm } from './components/employee-form';

const STATUSES = Object.values(EMPLOYEE_STATUSES);

const COLUMNS: readonly DataTableColumn<EmployeeDto>[] = [
  {
    id: 'name',
    header: 'Employee',
    render: (employee) => <StackedCell primary={employee.name} secondary={employee.employeeCode} />,
  },
  { id: 'role', header: 'Role', render: (employee) => employee.role },
  { id: 'phone', header: 'Phone', render: (employee) => employee.phone || '—' },
  {
    id: 'dailyRate',
    header: 'Daily wage',
    numeric: true,
    render: (employee) => formatAmount(employee.dailyRate),
  },
  {
    id: 'status',
    header: 'Status',
    render: (employee) => <StatusBadge status={employee.status} />,
  },
];

export function EmployeesPage() {
  const canManage = useCan('manageEmployees');

  return (
    <ResourceListPage<EmployeeDto>
      title="Employees"
      description="Payroll staff, their roles and daily rates."
      noun="employee"
      api={RESOURCE_API.employees}
      statuses={STATUSES}
      searchLabel="Name, code, phone or role"
      columns={COLUMNS}
      canManage={canManage}
      itemName={(employee) => employeeOption(employee).label}
      intro={{
        icon: Users,
        title: 'Add your first employee',
        message:
          'Employees are workers on your own payroll. Add each one with their daily wage so you can give them work and pay them.',
      }}
      Form={EmployeeForm}
    />
  );
}
