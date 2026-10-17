import { EXPENSE_CATEGORIES, FIELD_LIMITS, type ExpenseDto } from '@umc/shared';
import { ChoiceChips } from '@/components/forms/choice-chips';
import { DateField } from '@/components/forms/date-field';
import { EntityForm } from '@/components/forms/entity-form';
import { MissingRecordsHint } from '@/components/forms/missing-records-hint';
import { MoneyField } from '@/components/forms/money-field';
import { SelectField } from '@/components/forms/select-field';
import { TextAreaField } from '@/components/forms/text-area-field';
import { TextField } from '@/components/forms/text-field';
import type { ResourceFormProps } from '@/components/pages/resource-list-view';
import { APP_ROUTES } from '@/config/routes';
import { useEntityForm } from '@/hooks/use-entity-form';
import { useSiteOptions } from '@/hooks/use-record-options';
import { PAYMENT_MODE_OPTIONS } from '@/lib/payment-modes';
import { createResource, RESOURCE_API, updateResource } from '@/lib/resource-api';
import { enumOptions } from '@/lib/select-options';
import { toCalendarDate, today } from '@/utils/calendar-date';
import {
  toCreateExpenseRequest,
  toExpenseChanges,
  toExpenseDraft,
  validateExpenseDraft,
} from '../lib/expense-form';

const CATEGORY_OPTIONS = enumOptions(EXPENSE_CATEGORIES);

export function ExpenseForm({ item: expense, onSaved, onCancel }: ResourceFormProps<ExpenseDto>) {
  const sites = useSiteOptions();
  const form = useEntityForm({
    initial: toExpenseDraft(expense),
    validate: validateExpenseDraft,
    submit: (draft) =>
      expense
        ? updateResource(RESOURCE_API.expenses, expense, toExpenseChanges(expense, draft))
        : createResource<ExpenseDto>(RESOURCE_API.expenses, toCreateExpenseRequest(draft)),
    onSaved,
  });
  const { bind } = form;

  return (
    <EntityForm
      form={form}
      submitLabel={expense ? 'Save changes' : 'Save expense'}
      requireChanges={Boolean(expense)}
      onCancel={onCancel}
    >
      <MissingRecordsHint source={sites} noun="sites" path={APP_ROUTES.sites} />
      <SelectField
        label="Which site?"
        required
        placeholder={sites.loading ? 'Loading sites…' : 'Choose a site'}
        options={sites.options}
        {...bind('siteId')}
      />
      <ChoiceChips label="Spent on" options={CATEGORY_OPTIONS} {...bind('category')} />
      <MoneyField {...bind('amount')} />
      <DateField label="Date" required max={toCalendarDate(today())} {...bind('expenseDate')} />
      <ChoiceChips label="Paid by" options={PAYMENT_MODE_OPTIONS} {...bind('paymentMode')} />
      <TextField
        label="Shop or supplier"
        placeholder="Optional"
        maxLength={FIELD_LIMITS.vendorName}
        {...bind('vendorName')}
      />
      <TextAreaField
        label="Note"
        placeholder="Optional, e.g. 20 bags of cement"
        maxLength={FIELD_LIMITS.description}
        {...bind('description')}
      />
    </EntityForm>
  );
}
