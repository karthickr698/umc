import {
  DASHBOARD_LIMITS,
  TREND_INTERVALS,
  type DashboardPaymentTotals,
  type DashboardSummaryDto,
  type DashboardTotals,
  type DashboardTransactionDto,
  type TenantUserDto,
  type TrendInterval,
} from '@umc/shared';
import * as dashboardActivityRepository from '../repositories/dashboard-activity.repository.js';
import type { TransactionRow } from '../repositories/dashboard-activity.repository.js';
import type { DashboardFilter } from '../repositories/dashboard-ledger.repository.js';
import * as dashboardRepository from '../repositories/dashboard.repository.js';
import type { DashboardTotalsRow, PaymentTotalsRow } from '../repositories/dashboard.repository.js';
import * as siteRepository from '../repositories/site.repository.js';
import { calendarDaySpan, fromCalendarDate, toCalendarDate } from '../utils/calendar-date.js';
import { omitUndefined } from '../utils/object.js';
import type { DashboardSummaryInput } from '../validators/dashboard.validator.js';
import { assertClientInCompany } from './client.service.js';
import { assertContractorInCompany } from './contractor.service.js';
import { assertSiteOfClient } from './site.service.js';
import { assertSiteInCompany } from './work-assignment.service.js';
import { resolveEmployee } from './worker.service.js';

function toTotals(row: DashboardTotalsRow | null): DashboardTotals {
  return {
    clientPaymentsReceived: row?.clientPaymentsReceived ?? 0,
    workerPayments: row?.workerPayments ?? 0,
    contractorPayments: row?.contractorPayments ?? 0,
    expenses: row?.expenses ?? 0,
    balance: row?.balance ?? 0,
  };
}

function toPaymentTotals(row: PaymentTotalsRow): DashboardPaymentTotals {
  return { totalAmount: row.totalAmount, paymentCount: row.paymentCount };
}

function toTransaction(row: TransactionRow): DashboardTransactionDto {
  return {
    id: row.id.toString(),
    kind: row.kind,
    date: toCalendarDate(row.date),
    amount: row.amount,
    paymentMode: row.paymentMode,
    ...(row.siteId && { siteId: row.siteId.toString() }),
    ...(row.siteName !== undefined && { siteName: row.siteName }),
    ...(row.siteCode !== undefined && { siteCode: row.siteCode }),
    ...(row.counterparty && { counterparty: row.counterparty }),
    ...(row.paymentType !== undefined && { paymentType: row.paymentType }),
    ...(row.expenseCategory !== undefined && { expenseCategory: row.expenseCategory }),
    ...(row.description !== undefined && { description: row.description }),
  };
}

/** Ranges with a start and at most `maxDailyTrendDays` long (an open end runs to today) trend per day. */
function pickTrendInterval({ from, to }: DashboardFilter): TrendInterval {
  if (!from) return TREND_INTERVALS.MONTH;
  const days = calendarDaySpan(from, to ?? new Date());
  return days <= DASHBOARD_LIMITS.maxDailyTrendDays ? TREND_INTERVALS.DAY : TREND_INTERVALS.MONTH;
}

/** Ids of the client's sites; worker payments and expenses are matched on these. */
async function findClientSiteIds(companyId: string, clientId: string): Promise<string[]> {
  const [, siteIds] = await Promise.all([
    assertClientInCompany(companyId, clientId),
    siteRepository.findIdsByClient(companyId, clientId),
  ]);
  return siteIds;
}

/** Checks every filtered record belongs to the company (in parallel) and resolves the client's sites. */
async function toRepositoryFilter(
  companyId: string,
  { siteId, clientId, employeeId, contractorId, from, to }: DashboardSummaryInput,
): Promise<DashboardFilter> {
  const [clientSiteIds] = await Promise.all([
    // With a site filter, the site alone scopes payments and expenses.
    clientId !== undefined && siteId === undefined
      ? findClientSiteIds(companyId, clientId)
      : undefined,
    siteId !== undefined &&
      (clientId !== undefined
        ? assertSiteOfClient(companyId, siteId, clientId)
        : assertSiteInCompany(companyId, siteId)),
    employeeId !== undefined && resolveEmployee(companyId, employeeId),
    contractorId !== undefined && assertContractorInCompany(companyId, contractorId),
  ]);

  return {
    ...(siteId !== undefined && { siteId }),
    ...(clientId !== undefined && { clientId }),
    ...(clientSiteIds !== undefined && { clientSiteIds }),
    ...(employeeId !== undefined && { employeeId }),
    ...(contractorId !== undefined && { contractorId }),
    ...(from !== undefined && { from: fromCalendarDate(from) }),
    ...(to !== undefined && { to: fromCalendarDate(to) }),
  };
}

/** All-time money totals of one site; the caller must already know the site is in the company. */
export async function siteTotals(companyId: string, siteId: string): Promise<DashboardTotals> {
  const { totals } = await dashboardRepository.summarize(companyId, { siteId });
  return toTotals(totals);
}

/**
 * Client receipts, worker payments, contractor payments and expenses matching the filters, with
 * the resulting balance, per-site, per-worker and per-contractor breakdowns, a trend over time
 * and the latest transactions.
 */
export async function summarize(
  actor: TenantUserDto,
  query: DashboardSummaryInput,
): Promise<DashboardSummaryDto> {
  const { companyId } = actor;
  const filter = await toRepositoryFilter(companyId, query);
  const interval = pickTrendInterval(filter);
  const [{ totals, bySite, byWorker, byContractor, trend }, recent] = await Promise.all([
    dashboardRepository.summarize(companyId, filter, interval),
    dashboardActivityRepository.recentTransactions(
      companyId,
      filter,
      DASHBOARD_LIMITS.recentTransactions,
    ),
  ]);

  return {
    filters: omitUndefined(query),
    totals: toTotals(totals),
    bySite: bySite.map((row) => ({
      siteId: row.siteId ? row.siteId.toString() : null,
      ...(row.name !== undefined && { siteName: row.name }),
      ...(row.code !== undefined && { siteCode: row.code }),
      ...toTotals(row),
    })),
    byWorker: byWorker.map((row) => ({
      employeeId: row.employeeId.toString(),
      ...(row.name !== undefined && { name: row.name }),
      ...(row.employeeCode !== undefined && { employeeCode: row.employeeCode }),
      ...toPaymentTotals(row),
    })),
    byContractor: byContractor.map((row) => ({
      contractorId: row.contractorId.toString(),
      ...(row.name !== undefined && { name: row.name }),
      ...toPaymentTotals(row),
    })),
    trend: {
      interval,
      points: trend.map(({ period, ...totals }) => ({ period, ...toTotals(totals) })),
    },
    recentTransactions: recent.map(toTransaction),
  };
}
