import { ContractorEmployeeModel } from '../models/contractor-employee.model.js';
import { ContractorModel } from '../models/contractor.model.js';
import { EmployeeModel } from '../models/employee.model.js';
import { InvoiceModel } from '../models/invoice.model.js';
import { PaymentModel } from '../models/payment.model.js';
import { SiteModel } from '../models/site.model.js';
import { nameLookup } from '../utils/aggregation.js';
import type { SkipLimit } from '../utils/pagination.js';
import {
  PAYMENT_LIST_SORT,
  toPaymentQuery,
  type PaymentFilter,
  type PaymentRecord,
} from './payment.repository.js';
import type { InvoiceRecord } from './invoice.repository.js';

/** A payment with the names of what it references; a name is absent when its record is gone. */
export interface PaymentHistoryRow extends PaymentRecord {
  siteName?: string;
  siteCode?: string;
  workerName?: string | null;
  workerCode?: string | null;
  contractorName?: string;
  /** The payment's invoice (at most one), when one was issued. */
  invoice?: InvoiceRecord;
}

/** Same order and filters as `listByCompany`; names are looked up for the requested page only. */
export async function listHistoryByCompany(
  companyId: string,
  filter: PaymentFilter,
  page: SkipLimit,
): Promise<{ items: PaymentHistoryRow[]; total: number }> {
  const query = toPaymentQuery(companyId, filter);
  const [items, total] = await Promise.all([
    PaymentModel.aggregate<PaymentHistoryRow>([
      { $match: query },
      { $sort: PAYMENT_LIST_SORT },
      { $skip: page.skip },
      { $limit: page.limit },
      ...nameLookup(
        SiteModel.collection.name,
        'siteId',
        { name: 1, code: 1 },
        { name: 'siteName', code: 'siteCode' },
      ),
      ...nameLookup(
        EmployeeModel.collection.name,
        'employeeId',
        { name: 1, employeeCode: 1 },
        { name: 'employeeName', employeeCode: 'employeeCode' },
      ),
      ...nameLookup(
        ContractorEmployeeModel.collection.name,
        'contractorEmployeeId',
        { name: 1, employeeCode: 1 },
        { name: 'contractorEmployeeName', employeeCode: 'contractorEmployeeCode' },
      ),
      ...nameLookup(
        ContractorModel.collection.name,
        'contractorId',
        { name: 1 },
        { name: 'contractorName' },
      ),
      {
        // Each payment references exactly one kind of worker, depending on `workerType`.
        $set: {
          workerName: { $ifNull: ['$employeeName', '$contractorEmployeeName'] },
          workerCode: { $ifNull: ['$employeeCode', '$contractorEmployeeCode'] },
        },
      },
      {
        $lookup: {
          from: InvoiceModel.collection.name,
          localField: '_id',
          foreignField: 'paymentId',
          pipeline: [{ $match: { companyId: query.companyId } }, { $project: { pdfKey: 0 } }],
          as: 'invoices',
        },
      },
      { $set: { invoice: { $first: '$invoices' } } },
      {
        $unset: [
          'invoices',
          'employeeName',
          'employeeCode',
          'contractorEmployeeName',
          'contractorEmployeeCode',
        ],
      },
    ]).exec(),
    PaymentModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}
