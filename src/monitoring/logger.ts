/**
 * Security logging infrastructure
 *
 * Provides structured logging for security events with context enrichment.
 * Logs are stored in JSON Lines format for easy parsing and analysis.
 *
 * Features:
 * - Structured JSON logging
 * - Log levels: INFO, WARN, ERROR, CRITICAL
 * - Context enrichment (user, workflow, timestamp)
 * - File-based storage with daily rotation
 * - Privacy-preserving (no PII, only metadata)
 * - Automatic log rotation based on retention policy
 */

import { appendFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { loadSecurityConfig } from '../security/config';
import type { InjectionPattern, WorkflowType } from '../security/types';

/**
 * Log severity levels
 */
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Log category types
 */
export type LogCategory = 'injection' | 'validation' | 'rate-limit' | 'alert' | 'system';

/**
 * Structured log entry
 */
export interface LogEntry {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Log severity level */
  level: LogLevel;
  /** Category of the log */
  category: LogCategory;
  /** Log message */
  message: string;
  /** Additional context */
  context: Record<string, unknown>;
}

/**
 * Security logger class
 * Handles structured logging for security events
 */
export class SecurityLogger {
  private logDir: string;

  /**
   * Create a new SecurityLogger instance
   *
   * @param logDir - Directory to store log files (defaults to data/security-logs)
   */
  constructor(logDir?: string) {
    this.logDir = logDir ?? join(process.cwd(), 'data', 'security-logs');
    this.ensureLogDir();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDir(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get log file path for current date
   *
   * @param date - Date for log file (defaults to today)
   * @returns Absolute path to log file
   */
  private getLogFilePath(date: Date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return join(this.logDir, `security-${dateStr}.log`);
  }

  /**
   * Log a message with context
   *
   * @param level - Log severity level
   * @param category - Log category
   * @param message - Log message
   * @param context - Additional context
   *
   * @example
   * ```typescript
   * logger.log(LogLevel.WARN, 'injection', 'Injection attempt detected', {
   *   user: 'username',
   *   pattern: 'role-switching'
   * });
   * ```
   */
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context: Record<string, unknown> = {},
  ): void {
    const config = loadSecurityConfig();

    // Check if logging is enabled
    if (!config.logging.enabled) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
    };

    const logFile = this.getLogFilePath();
    const logLine = JSON.stringify(entry) + '\n';

    // Atomic append (safe for concurrent writes)
    appendFileSync(logFile, logLine, { encoding: 'utf-8' });

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      const color = this.getColor(level);
      console.log(`${color}[${level}] ${category}: ${message}\x1b[0m`, context);
    }
  }

  /**
   * Get console color for log level
   */
  private getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.INFO:
        return '\x1b[36m'; // Cyan
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      case LogLevel.CRITICAL:
        return '\x1b[35m'; // Magenta
      default:
        return '\x1b[0m'; // Reset
    }
  }

  /**
   * Log an injection attempt
   *
   * @param user - GitHub username
   * @param workflow - Workflow where injection occurred
   * @param pattern - Injection pattern detected
   * @param blocked - Whether the attempt was blocked
   * @param issueNumber - Optional issue/PR number
   *
   * @example
   * ```typescript
   * logger.logInjectionAttempt('user123', 'triage', 'role-switching', true, 42);
   * ```
   */
  logInjectionAttempt(
    user: string,
    workflow: WorkflowType,
    pattern: InjectionPattern,
    blocked: boolean,
    issueNumber?: number,
  ): void {
    this.log(LogLevel.WARN, 'injection', 'Injection attempt detected', {
      user,
      workflow,
      pattern,
      blocked,
      issueNumber,
    });
  }

  /**
   * Log a validation failure
   *
   * @param file - File that failed validation
   * @param errors - List of validation errors
   *
   * @example
   * ```typescript
   * logger.logValidationFailure('data/themes.json', ['Invalid schema', 'Missing required field']);
   * ```
   */
  logValidationFailure(file: string, errors: string[]): void {
    this.log(LogLevel.ERROR, 'validation', 'Data validation failed', {
      file,
      errors,
      errorCount: errors.length,
    });
  }

  /**
   * Log a rate limit event
   *
   * @param entityId - User or repository identifier
   * @param scope - Scope of rate limiting
   * @param blocked - Whether the entity is blocked
   * @param attempts - Number of attempts
   *
   * @example
   * ```typescript
   * logger.logRateLimit('user123', 'user', true, 10);
   * ```
   */
  logRateLimit(entityId: string, scope: 'user' | 'repo', blocked: boolean, attempts: number): void {
    const level = blocked ? LogLevel.ERROR : LogLevel.WARN;
    const message = blocked ? 'Rate limit exceeded' : 'Rate limit warning';

    this.log(level, 'rate-limit', message, {
      entityId,
      scope,
      blocked,
      attempts,
    });
  }

  /**
   * Log an alert event
   *
   * @param alertType - Type of alert
   * @param severity - Alert severity
   * @param message - Alert message
   * @param context - Additional context
   *
   * @example
   * ```typescript
   * logger.logAlert('issue-created', 'high', 'Security issue created for repeated offender', {
   *   user: 'user123',
   *   issueNumber: 99
   * });
   * ```
   */
  logAlert(
    alertType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    context: Record<string, unknown> = {},
  ): void {
    const level = severity === 'critical' ? LogLevel.CRITICAL : LogLevel.ERROR;

    this.log(level, 'alert', message, {
      alertType,
      severity,
      ...context,
    });
  }

  /**
   * Log a system event
   *
   * @param message - Event message
   * @param context - Additional context
   *
   * @example
   * ```typescript
   * logger.logSystemEvent('Security logs cleaned up', { deletedFiles: 5 });
   * ```
   */
  logSystemEvent(message: string, context: Record<string, unknown> = {}): void {
    this.log(LogLevel.INFO, 'system', message, context);
  }

  /**
   * Clean up old log files based on retention policy
   *
   * @param retentionDays - Number of days to retain logs (defaults to config)
   * @returns Number of files deleted
   *
   * @example
   * ```typescript
   * const deleted = logger.cleanupOldLogs();
   * console.log(`Deleted ${deleted} old log files`);
   * ```
   */
  cleanupOldLogs(retentionDays?: number): number {
    const config = loadSecurityConfig();
    const retention = retentionDays ?? config.logging.retentionDays;

    if (!existsSync(this.logDir)) {
      return 0;
    }

    const now = Date.now();
    const retentionMs = retention * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(now - retentionMs);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    let deletedCount = 0;

    const files = readdirSync(this.logDir);
    for (const file of files) {
      // Match log file pattern: security-YYYY-MM-DD.log
      const match = file.match(/^security-(\d{4}-\d{2}-\d{2})\.log$/);
      if (!match) {
        continue;
      }

      const fileDate = match[1];
      if (fileDate < cutoffStr) {
        const filePath = join(this.logDir, file);
        unlinkSync(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logSystemEvent('Old log files cleaned up', { deletedCount });
    }

    return deletedCount;
  }
}

/**
 * Default logger instance
 * Use this singleton for consistent logging across the application
 */
export const logger = new SecurityLogger();
