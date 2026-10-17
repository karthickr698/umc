import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  FIELD_LIMITS,
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus,
} from '@umc/shared';
import { EMAIL_PATTERN, baseSchemaOptions } from '../utils/mongoose-schema.js';

export interface User {
  /** Absent only for SUPER_ADMIN, who belongs to no company. */
  companyId?: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  /** Excluded from queries by default; select it explicitly with `+passwordHash`. */
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [
        function (this: User) {
          return this.role !== USER_ROLES.SUPER_ADMIN;
        },
        'Company is required',
      ],
      validate: {
        validator: function (this: User, value: Types.ObjectId | undefined) {
          return this.role !== USER_ROLES.SUPER_ADMIN || value === undefined || value === null;
        },
        message: 'A super admin cannot belong to a company',
      },
    },
    name: { type: String, required: true, trim: true, maxlength: FIELD_LIMITS.name },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: FIELD_LIMITS.email,
      match: [EMAIL_PATTERN, 'Invalid email address'],
    },
    phone: { type: String, trim: true, maxlength: FIELD_LIMITS.phone },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.STAFF,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUSES),
      default: USER_STATUSES.ACTIVE,
      required: true,
    },
  },
  baseSchemaOptions<User>(['passwordHash']),
);

// Email is globally unique so a future login can resolve the user (and tenant) from email alone.
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ companyId: 1, role: 1 });

export const UserModel: Model<User> =
  (mongoose.models.User as Model<User> | undefined) ?? model<User>('User', userSchema);
