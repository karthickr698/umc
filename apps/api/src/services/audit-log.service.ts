import type { AuditAction, AuditEntity, UserDto } from '@umc/shared';
import { logger } from '../config/logger.js';
import * as auditLogRepository from '../repositories/audit-log.repository.js';
import { redactSecrets } from '../utils/redact.js';

export type AuditActor = Pick<UserDto, 'id' | 'companyId'>;

export interface AuditEvent {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records actions the actor already performed. Best effort: the action itself has succeeded, so
 * a failed audit write is logged instead of failing the request.
 */
export async function recordMany(actor: AuditActor, events: readonly AuditEvent[]): Promise<void> {
  const entries = events.map(({ metadata, ...event }) => {
    const safeMetadata = metadata && redactSecrets(metadata);
    return {
      ...event,
      userId: actor.id,
      companyId: actor.companyId,
      ...(safeMetadata && Object.keys(safeMetadata).length > 0 && { metadata: safeMetadata }),
    };
  });
  try {
    await auditLogRepository.createMany(entries);
  } catch (err) {
    logger.error(
      {
        err,
        userId: actor.id,
        companyId: actor.companyId,
        events: events.map(({ action, entity, entityId }) => ({ action, entity, entityId })),
      },
      'Failed to write audit log',
    );
  }
}

export function record(actor: AuditActor, event: AuditEvent): Promise<void> {
  return recordMany(actor, [event]);
}

/** Flat, non-sensitive view of a record's business fields, as stored in audit metadata. */
export type AuditSnapshot = Readonly<Record<string, string | number | boolean | undefined>>;

type SnapshotValue = string | number | boolean | null;

/** The fields that differ between two snapshots; a missing value is reported as `null`. */
export function changedFields(
  before: AuditSnapshot,
  after: AuditSnapshot,
): Record<string, { from: SnapshotValue; to: SnapshotValue }> {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: Record<string, { from: SnapshotValue; to: SnapshotValue }> = {};
  for (const key of keys) {
    const from = before[key] ?? null;
    const to = after[key] ?? null;
    if (from !== to) changes[key] = { from, to };
  }
  return changes;
}
