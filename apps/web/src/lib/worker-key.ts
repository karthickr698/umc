import { WORKER_TYPES, type WorkerType } from '@umc/shared';

const SEPARATOR = ':';

/** Identifies an employee or contractor employee uniquely across both kinds. */
export function workerKey(workerType: WorkerType, id: string): string {
  return `${workerType}${SEPARATOR}${id}`;
}

/** Inverse of `workerKey`; `undefined` for anything it did not produce. */
export function parseWorkerKey(key: string): { workerType: WorkerType; id: string } | undefined {
  const [workerType, id] = key.split(SEPARATOR);
  const known = Object.values<string>(WORKER_TYPES).includes(workerType ?? '');
  return known && id ? { workerType: workerType as WorkerType, id } : undefined;
}
