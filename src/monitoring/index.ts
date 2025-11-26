/**
 * Security monitoring and logging module
 *
 * Provides centralized logging, metrics collection, and dashboard generation
 * for security events and threat monitoring.
 */

export { SecurityLogger, logger, LogLevel } from './logger';
export type { LogEntry, LogCategory } from './logger';
export {
  collectSecurityMetrics,
  collectLogStatistics,
  getMetricsForTimeRange,
  getTopUsersByAttempts,
  readLogEntries,
} from './metrics';
export type { SecurityMetrics, LogStatistics, TimeRange } from './metrics';
