/** What a user did; paired with an `AuditEntity` naming what it was done to. */
export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SEND_WHATSAPP: 'SEND_WHATSAPP',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ENTITIES = {
  USER: 'USER',
  PAYMENT: 'PAYMENT',
  CLIENT_PAYMENT: 'CLIENT_PAYMENT',
  EXPENSE: 'EXPENSE',
  WORK_ASSIGNMENT: 'WORK_ASSIGNMENT',
  INVOICE: 'INVOICE',
} as const;

export type AuditEntity = (typeof AUDIT_ENTITIES)[keyof typeof AUDIT_ENTITIES];
