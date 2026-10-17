import { Schema, type SchemaDefinitionProperty, type SchemaOptions } from 'mongoose';
import {
  FIELD_LIMITS,
  MONEY_LIMITS,
  PAYMENT_MODES,
  type Address,
  type PaymentMode,
} from '@umc/shared';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Options every top-level schema should use: timestamps, and JSON output shaped like the
 * shared DTOs (`id` instead of `_id`, no `__v`). `hiddenFields` are stripped from JSON even
 * when a query explicitly selects them (e.g. `+passwordHash`).
 */
export function baseSchemaOptions<T>(hiddenFields: readonly string[] = []): SchemaOptions<T> {
  return {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret: Record<string, unknown>) {
        delete ret._id;
        for (const field of hiddenFields) delete ret[field];
        return ret;
      },
    },
  };
}

/** Required payment or expense amount. */
export const moneyAmountField: SchemaDefinitionProperty<number> = {
  type: Number,
  required: true,
  min: MONEY_LIMITS.minAmount,
  max: MONEY_LIMITS.maxAmount,
};

export const paymentModeField: SchemaDefinitionProperty<PaymentMode> = {
  type: String,
  enum: Object.values(PAYMENT_MODES),
  required: true,
};

/** UPI transaction id, cheque number, bank reference, etc. */
export const referenceNumberField: SchemaDefinitionProperty<string> = {
  type: String,
  trim: true,
  maxlength: FIELD_LIMITS.referenceNumber,
};

export const descriptionField: SchemaDefinitionProperty<string> = {
  type: String,
  trim: true,
  maxlength: FIELD_LIMITS.description,
};

/** Embedded postal address, shared by every model that stores one. */
export const addressSchema = new Schema<Address>(
  {
    line1: { type: String, trim: true, maxlength: FIELD_LIMITS.addressLine },
    line2: { type: String, trim: true, maxlength: FIELD_LIMITS.addressLine },
    city: { type: String, trim: true, maxlength: FIELD_LIMITS.city },
    state: { type: String, trim: true, maxlength: FIELD_LIMITS.state },
    postalCode: { type: String, trim: true, maxlength: FIELD_LIMITS.postalCode },
    country: { type: String, trim: true, maxlength: FIELD_LIMITS.country },
  },
  { _id: false },
);
