/**
 * Injection attempt tracking module
 *
 * Tracks and stores prompt injection attempts for monitoring and analysis.
 * Uses file-based storage compatible with GitHub Actions environment.
 *
 * Features:
 * - Append-only log files (one per day)
 * - Privacy-preserving (stores content hashes, not full content)
 * - Automatic log rotation based on retention policy
 * - Concurrent-safe (atomic file writes)
 */

import { appendFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { InjectionAttempt, InjectionPattern, WorkflowType } from './types';
import { loadSecurityConfig } from './config';

/**
 * Get the directory where security logs are stored
 * @returns Absolute path to security logs directory
 */
export function getSecurityLogsDir(): string {
  return join(process.cwd(), 'data', 'security-logs');
}

/**
 * Ensure security logs directory exists
 * Creates the directory if it doesn't exist
 */
export function ensureSecurityLogsDir(): void {
  const logDir = getSecurityLogsDir();
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
}

/**
 * Generate content hash for privacy
 * Only stores first 8 characters to prevent content recovery
 *
 * @param content - Content to hash
 * @returns First 8 characters of SHA-256 hash
 */
export function generateContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 8);
}

/**
 * Get log file path for a specific date
 *
 * @param date - Date for log file (defaults to today)
 * @returns Absolute path to log file
 */
export function getLogFilePath(date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return join(getSecurityLogsDir(), `injections-${dateStr}.jsonl`);
}

/**
 * Track an injection attempt
 * Appends to daily log file in JSON Lines format
 *
 * @param attempt - Injection attempt to track
 *
 * @example
 * ```typescript
 * trackInjectionAttempt({
 *   timestamp: new Date().toISOString(),
 *   user: 'username',
 *   workflow: 'triage',
 *   pattern: 'role-switching',
 *   contentHash: generateContentHash(content),
 *   blocked: false
 * });
 * ```
 */
export function trackInjectionAttempt(attempt: InjectionAttempt): void {
  const config = loadSecurityConfig();

  // Check if logging is enabled
  if (!config.logging.enabled) {
    return;
  }

  ensureSecurityLogsDir();

  const logFile = getLogFilePath();
  const logEntry = JSON.stringify(attempt) + '\n';

  // Atomic append (safe for concurrent writes)
  appendFileSync(logFile, logEntry, { encoding: 'utf-8' });
}

/**
 * Clean up old log files based on retention policy
 * Removes files older than configured retention days
 *
 * @param retentionDays - Number of days to retain logs (defaults to config)
 * @returns Number of files deleted
 *
 * @example
 * ```typescript
 * const deleted = cleanupOldLogs();
 * console.log(`Deleted ${deleted} old log files`);
 * ```
 */
export function cleanupOldLogs(retentionDays?: number): number {
  const config = loadSecurityConfig();
  const retention = retentionDays ?? config.logging.retentionDays;
  const logDir = getSecurityLogsDir();

  if (!existsSync(logDir)) {
    return 0;
  }

  const now = Date.now();
  const retentionMs = retention * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(now - retentionMs);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  let deletedCount = 0;

  const files = readdirSync(logDir);
  for (const file of files) {
    // Match log file pattern: injections-YYYY-MM-DD.jsonl
    const match = file.match(/^injections-(\d{4}-\d{2}-\d{2})\.jsonl$/);
    if (!match) {
      continue;
    }

    const fileDate = match[1];
    if (fileDate < cutoffStr) {
      const filePath = join(logDir, file);
      unlinkSync(filePath);
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Parse all injection attempts from log files
 * Reads all daily log files and parses attempts
 *
 * @param startDate - Optional start date to filter logs
 * @param endDate - Optional end date to filter logs
 * @returns Array of injection attempts
 *
 * @example
 * ```typescript
 * // Get all attempts from last 7 days
 * const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
 * const attempts = readInjectionAttempts(weekAgo);
 * ```
 */
export function readInjectionAttempts(
  startDate?: Date,
  endDate: Date = new Date(),
): InjectionAttempt[] {
  const logDir = getSecurityLogsDir();

  if (!existsSync(logDir)) {
    return [];
  }

  const startStr = startDate?.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const attempts: InjectionAttempt[] = [];
  const files = readdirSync(logDir);

  for (const file of files) {
    const match = file.match(/^injections-(\d{4}-\d{2}-\d{2})\.jsonl$/);
    if (!match) {
      continue;
    }

    const fileDate = match[1];

    // Filter by date range
    if (startStr && fileDate < startStr) {
      continue;
    }
    if (fileDate > endStr) {
      continue;
    }

    // Read and parse log file
    const filePath = join(logDir, file);
    try {
      const content = require('node:fs').readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        try {
          const attempt = JSON.parse(line) as InjectionAttempt;
          attempts.push(attempt);
        } catch (parseError) {
          // Skip malformed lines
          console.error(`Failed to parse log line: ${line}`, parseError);
        }
      }
    } catch (readError) {
      console.error(`Failed to read log file: ${filePath}`, readError);
    }
  }

  return attempts;
}

/**
 * Get injection attempts for a specific user
 *
 * @param user - GitHub username
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Array of injection attempts by user
 */
export function getInjectionAttemptsByUser(
  user: string,
  startDate?: Date,
  endDate?: Date,
): InjectionAttempt[] {
  const allAttempts = readInjectionAttempts(startDate, endDate);
  return allAttempts.filter((attempt) => attempt.user === user);
}

/**
 * Get unique users with injection attempts
 *
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Array of unique usernames
 */
export function getUniqueUsersWithAttempts(startDate?: Date, endDate?: Date): string[] {
  const attempts = readInjectionAttempts(startDate, endDate);
  const users = new Set(attempts.map((a) => a.user));
  return Array.from(users);
}

/**
 * Count injection attempts by pattern
 *
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Map of pattern to count
 */
export function countAttemptsByPattern(
  startDate?: Date,
  endDate?: Date,
): Map<InjectionPattern, number> {
  const attempts = readInjectionAttempts(startDate, endDate);
  const counts = new Map<InjectionPattern, number>();

  for (const attempt of attempts) {
    const current = counts.get(attempt.pattern) ?? 0;
    counts.set(attempt.pattern, current + 1);
  }

  return counts;
}

/**
 * Count injection attempts by workflow type
 *
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Map of workflow type to count
 */
export function countAttemptsByWorkflow(
  startDate?: Date,
  endDate?: Date,
): Map<WorkflowType, number> {
  const attempts = readInjectionAttempts(startDate, endDate);
  const counts = new Map<WorkflowType, number>();

  for (const attempt of attempts) {
    const current = counts.get(attempt.workflow) ?? 0;
    counts.set(attempt.workflow, current + 1);
  }

  return counts;
}
