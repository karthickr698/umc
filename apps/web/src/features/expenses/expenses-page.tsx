import { useMemo } from 'react';
import { Receipt } from 'lucide-react';
import type { ExpenseDto, Paginated } from '@umc/shared';
import type { DataTableColumn } from '@/components/data/data-table';
import { StackedCell } from '@/components/data/stacked-cell';
import { ResourceListView } from '@/components/pages/resource-list-view';
import { PAYMENT_MODE_LABELS } from '@/config/labels';
import { useApiQuery } from '@/hooks/use-api-query';
import { useCan } from '@/hooks/use-can';
import { useOptionLabels, useSiteOptions } from '@/hooks/use-record-options';
import { RESOURCE_API } from '@/lib/resource-api';
import { formatAmount, formatCalendarDate, humanizeEnum } from '@/utils/format';
import { ExpenseFilters } from './components/expense-filters';
import { ExpenseForm } from './components/expense-form';
import { useExpenseFilters } from './hooks/use-expense-filters';

function expenseColumns(siteNames: ReadonlyMap<string, string>): DataTableColumn<ExpenseDto>[] {
  return [
    { id: 'date', header: 'Date', render: (expense) => formatCalendarDate(expense.expenseDate) },
    { id: 'site', header: 'Site', render: (expense) => siteNames.get(expense.siteId) ?? '—' },
    {
      id: 'category',
      header: 'Spent on',
      mobile: 'title',
      render: (expense) => (
        <StackedCell
          primary={humanizeEnum(expense.category)}
          secondary={expense.vendorName || expense.description}
        />
      ),
    },
    {
      id: 'mode',
      header: 'Paid by',
      render: (expense) => PAYMENT_MODE_LABELS[expense.paymentMode],
    },
    {
      id: 'amount',
      header: 'Amount',
      numeric: true,
      mobile: 'aside',
      render: (expense) => <strong>{formatAmount(expense.amount)}</strong>,
    },
  ];
}

const expenseName = (expense: ExpenseDto) =>
  `${formatAmount(expense.amount)} on ${humanizeEnum(expense.category).toLowerCase()}`;

export function ExpensesPage() {
  const canManage = useCan('manageExpenses');
  const { filters, query, activeCount, update, reset, setPage } = useExpenseFilters();
  const list = useApiQuery<Paginated<ExpenseDto>>(RESOURCE_API.expenses.list({ ...query }));
  const sites = useSiteOptions();
  const siteNames = useOptionLabels(sites);
  const columns = useMemo(() => expenseColumns(siteNames), [siteNames]);

  return (
    <ResourceListView<ExpenseDto>
      title="Site expenses"
      description="Money spent on a site: materials, transport, equipment and more."
      noun="expense"
      addLabel="Add expense"
      api={RESOURCE_API.expenses}
      list={list}
      filtered={activeCount > 0}
      filters={
        <ExpenseFilters
          filters={filters}
          activeCount={activeCount}
          sites={sites}
          onChange={update}
          onReset={reset}
        />
      }
      intro={{
        icon: Receipt,
        title: 'Record your first expense',
        message:
          'Each time you spend money on a site, such as cement, sand, a truck or tools, add it here so you always know what each site has cost.',
      }}
      onPageChange={setPage}
      columns={columns}
      canManage={canManage}
      itemName={expenseName}
      Form={ExpenseForm}
    />
  );
}
