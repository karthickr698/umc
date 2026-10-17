import {
  EXPENSE_CATEGORIES,
  FIELD_LIMITS,
  PAYMENT_MODES,
  type CreateExpenseRequest,
  type ExpenseDto,
  type UpdateExpenseRequest,
} from '@umc/shared';
import { changedFields, textError, toEnum, withoutEmpty, type DraftErrors } from '@/lib/form-draft';
import { amountError, parseAmount } from '@/lib/money';
import { isCalendarDate, toCalendarDate, today } from '@/utils/calendar-date';

export type ExpenseDraft = {
  siteId: string;
  category: string;
  amount: string;
  expenseDate: string;
  paymentMode: string;
  vendorName: string;
  description: string;
};

/** New expenses default to today, paid in cash. */
export function toExpenseDraft(expense?: ExpenseDto): ExpenseDraft {
  return {
    siteId: expense?.siteId ?? '',
    category: expense?.category ?? '',
    amount: expense ? expense.amount.toFixed(2) : '',
    expenseDate: expense?.expenseDate ?? toCalendarDate(today()),
    paymentMode: expense?.paymentMode ?? PAYMENT_MODES.CASH,
    vendorName: expense?.vendorName ?? '',
    description: expense?.description ?? '',
  };
}

export function validateExpenseDraft(draft: ExpenseDraft) {
  const errors: DraftErrors<ExpenseDraft> = {
    siteId: draft.siteId ? undefined : 'Choose the site',
    category: draft.category ? undefined : 'Choose what the money was spent on',
    amount: amountError(draft.amount),
    expenseDate: isCalendarDate(draft.expenseDate) ? undefined : 'Pick the date',
    vendorName: textError(draft.vendorName, { label: 'Shop', max: FIELD_LIMITS.vendorName }),
    description: textError(draft.description, {
      label: 'Note',
      max: FIELD_LIMITS.description,
    }),
  };
  return errors;
}

function toRequest(draft: ExpenseDraft): CreateExpenseRequest {
  return {
    siteId: draft.siteId,
    category: toEnum(EXPENSE_CATEGORIES, draft.category, EXPENSE_CATEGORIES.OTHER),
    amount: parseAmount(draft.amount) ?? 0,
    expenseDate: draft.expenseDate,
    paymentMode: toEnum(PAYMENT_MODES, draft.paymentMode, PAYMENT_MODES.CASH),
    vendorName: draft.vendorName.trim(),
    description: draft.description.trim(),
  };
}

export function toCreateExpenseRequest(draft: ExpenseDraft): CreateExpenseRequest {
  const { vendorName, description, ...required } = toRequest(draft);
  return { ...required, ...withoutEmpty({ vendorName, description }) };
}

export function toExpenseChanges(expense: ExpenseDto, draft: ExpenseDraft): UpdateExpenseRequest {
  return changedFields(toRequest(toExpenseDraft(expense)), toRequest(draft));
}
