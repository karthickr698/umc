import type { AuditAction, AuditEntity } from '@umc/shared';
import { AuditLogModel } from '../models/audit-log.model.js';

export interface NewAuditLog {
  userId: string;
  companyId: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function createMany(entries: readonly NewAuditLog[]): Promise<void> {
  if (entries.length === 0) return;
  await AuditLogModel.insertMany(entries);
}
