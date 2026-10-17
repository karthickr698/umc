import type { WorkerSummaryListItem, WorkerType } from '@umc/shared';
import { workerKey } from '@/lib/worker-key';

/** Someone who can be paid against the chosen site, with what they are still owed there. */
export interface PaymentWorker {
  /** See `workerKey`. */
  key: string;
  id: string;
  workerType: WorkerType;
  name: string;
  code: string;
  contractorId?: string;
  contractorName?: string;
  /** Negative when paid ahead, e.g. after an advance. */
  outstandingAmount: number;
}

/** Keeps the summaries' order: highest outstanding amount first. */
export function toPaymentWorkers(
  summaries: readonly WorkerSummaryListItem[],
  contractorNames: ReadonlyMap<string, string>,
): PaymentWorker[] {
  return summaries.map(({ worker, totals }) => ({
    key: workerKey(worker.workerType, worker.id),
    id: worker.id,
    workerType: worker.workerType,
    name: worker.name,
    code: worker.employeeCode,
    ...(worker.contractorId && {
      contractorId: worker.contractorId,
      contractorName: contractorNames.get(worker.contractorId),
    }),
    outstandingAmount: totals.outstandingAmount,
  }));
}

/** Case-insensitive match on name, code or contractor; an empty query matches everyone. */
export function matchesPaymentWorker(worker: PaymentWorker, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [worker.name, worker.code, worker.contractorName ?? ''].some((field) =>
    field.toLowerCase().includes(needle),
  );
}
