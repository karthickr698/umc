// `unreachable`: the driver reports an open connection but MongoDB did not answer a ping.
export type DatabaseStatus =
  'connected' | 'connecting' | 'disconnected' | 'disconnecting' | 'unreachable';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime: number;
  timestamp: string;
  version: string;
  database: DatabaseStatus;
  /** Round-trip time of the database ping; only present when `database` is `connected`. */
  databaseLatencyMs?: number;
}
