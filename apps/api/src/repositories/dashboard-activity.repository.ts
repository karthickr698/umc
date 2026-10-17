import type { Types } from 'mongoose';
import type { ExpenseCategory, PaymentMode, PaymentType, TransactionKind } from '@umc/shared';
import { ClientModel } from '../models/client.model.js';
import { ClientPaymentModel } from '../models/client-payment.model.js';
import { ContractorModel } from '../models/contractor.model.js';
import { EmployeeModel } from '../models/employee.model.js';
import { SiteModel } from '../models/site.model.js';
import { nameLookup } from '../utils/aggregation.js';
import { ledgerStages, type DashboardFilter } from './dashboard-ledger.repository.js';

export interface TransactionRow {
  id: Types.ObjectId;
  kind: TransactionKind;
  date: Date;
  amount: number;
  paymentMode: PaymentMode;
  siteId: Types.ObjectId | null;
  siteName?: string;
  siteCode?: string;
  /** `null` when the referenced record or vendor name is missing. */
  counterparty?: string | null;
  paymentType?: PaymentType;
  expenseCategory?: ExpenseCategory;
  description?: string;
}

/** Latest `limit` ledger entries, newest first, with site and counterparty names. */
export function recentTransactions(
  companyId: string,
  filter: DashboardFilter,
  limit: number,
): Promise<TransactionRow[]> {
  return ClientPaymentModel.aggregate<TransactionRow>([
    ...ledgerStages(companyId, filter, { details: true, latest: limit }),
    { $sort: { date: -1, createdAt: -1, id: -1 } },
    { $limit: limit },
    ...nameLookup(
      SiteModel.collection.name,
      'siteId',
      { name: 1, code: 1 },
      {
        name: 'siteName',
        code: 'siteCode',
      },
    ),
    ...nameLookup(ClientModel.collection.name, 'clientId', { name: 1 }, { name: 'clientName' }),
    ...nameLookup(
      EmployeeModel.collection.name,
      'employeeId',
      { name: 1 },
      {
        name: 'employeeName',
      },
    ),
    ...nameLookup(
      ContractorModel.collection.name,
      'contractorId',
      { name: 1 },
      {
        name: 'contractorName',
      },
    ),
    {
      // Each entry carries exactly one of these, depending on its kind.
      $set: {
        counterparty: {
          $ifNull: ['$clientName', '$employeeName', '$contractorName', '$vendorName'],
        },
      },
    },
    {
      $unset: [
        'createdAt',
        'clientId',
        'employeeId',
        'contractorId',
        'clientName',
        'employeeName',
        'contractorName',
        'vendorName',
      ],
    },
  ]).exec();
}
