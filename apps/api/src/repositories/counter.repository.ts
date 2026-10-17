import { CounterModel } from '../models/counter.model.js';

/** Atomically increments and returns the named sequence, starting at 1. */
export async function next(companyId: string, name: string): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    { companyId, name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: false },
  )
    .lean()
    .orFail()
    .exec();
  return counter.seq;
}
