import mongoose, { Schema, model, type Model, type Types } from 'mongoose';
import { AUDIT_ACTIONS, AUDIT_ENTITIES, type AuditAction, type AuditEntity } from '@umc/shared';

/**
 * Append-only record of an important action. `metadata` holds non-sensitive context (amounts,
 * changed fields, delivery status, ...); secrets are stripped before it is written.
 */
export interface AuditLog {
  userId: Types.ObjectId;
  /** `null` for users without a company (SUPER_ADMIN). */
  companyId: Types.ObjectId | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: Types.ObjectId;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const immutableObjectId = { type: Schema.Types.ObjectId, required: true, immutable: true };

const auditLogSchema = new Schema<AuditLog>(
  {
    userId: { ...immutableObjectId, ref: 'User' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null, immutable: true },
    action: { type: String, enum: Object.values(AUDIT_ACTIONS), required: true, immutable: true },
    entity: { type: String, enum: Object.values(AUDIT_ENTITIES), required: true, immutable: true },
    entityId: immutableObjectId,
    metadata: { type: Schema.Types.Mixed, immutable: true },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false }, versionKey: false, minimize: true },
);

auditLogSchema.index({ companyId: 1, timestamp: -1 });
auditLogSchema.index({ companyId: 1, entity: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });

export const AuditLogModel: Model<AuditLog> =
  (mongoose.models.AuditLog as Model<AuditLog> | undefined) ??
  model<AuditLog>('AuditLog', auditLogSchema);
