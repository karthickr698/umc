import mongoose, { Schema, model, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '../utils/mongoose-schema.js';

/** Per-company monotonic sequence, e.g. `invoice:2026` for that year's invoice numbers. */
export interface Counter {
  companyId: Types.ObjectId;
  name: string;
  /** Last value handed out. */
  seq: number;
  createdAt: Date;
  updatedAt: Date;
}

const counterSchema = new Schema<Counter>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true },
    seq: { type: Number, required: true, min: 0, default: 0 },
  },
  baseSchemaOptions<Counter>(),
);

counterSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const CounterModel: Model<Counter> =
  (mongoose.models.Counter as Model<Counter> | undefined) ??
  model<Counter>('Counter', counterSchema);
