/**
 * Security metrics collection and aggregation
 *
 * Collects and aggregates security metrics from logs and injection tracking data.
 * Provides functions for analyzing security trends, patterns, and threat levels.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { LogEntry, LogLevel, LogCategory } from './logger';
import type { InjectionPattern, WorkflowType } from '../security/types';
import {
  readInjectionAttempts,
  countAttemptsByPattern,
  countAttemptsByWorkflow,
  getUniqueUsersWithAttempts,
} from '../security/track-injections';
import { getTrackedEntities, getRateLimitStatus } from '../security/rate-limit';

/**
 * Security metrics for a time period
 */
export interface SecurityMetrics {
  /** Total injection attempts */
  totalAttempts: number;
  /** Number of blocked attempts */
  blockedAttempts: number;
  /** Number of unique users with attempts */
  uniqueUsers: number;
  /** Number of users currently blocked */
  blockedUsers: number;
  /** Pattern breakdown */
  patternBreakdown: Record<InjectionPattern, number>;
  /** Workflow breakdown */
  workflowBreakdown: Record<WorkflowType, number>;
  /** Time-series data (daily counts) */
  timeSeriesData: Array<{ date: string; attempts: number }>;
  /** Average attempts per day */
  avgAttemptsPerDay: number;
  /** Most common pattern */
  mostCommonPattern: InjectionPattern | null;
  /** Most targeted workflow */
  mostTargetedWorkflow: WorkflowType | null;
}

/**
 * Log statistics for a time period
 */
export interface LogStatistics {
  /** Total log entries */
  totalEntries: number;
  /** Breakdown by log level */
  levelBreakdown: Record<LogLevel, number>;
  /** Breakdown by category */
  categoryBreakdown: Record<LogCategory, number>;
  /** Number of critical events */
  criticalEvents: number;
  /** Number of errors */
  errors: number;
  /** Number of warnings */
  warnings: number;
}

/**
 * Time range for metrics collection
 */
export interface TimeRange {
  /** Start date (ISO 8601) */
  start: string;
  /** End date (ISO 8601) */
  end: string;
}

/**
 * Get path to security logs directory
 */
function getSecurityLogsDir(): string {
  return join(process.cwd(), 'data', 'security-logs');
}

/**
 * Read log entries from security log files
 *
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Array of log entries
 */
export function readLogEntries(startDate?: Date, endDate: Date = new Date()): LogEntry[] {
  const logDir = getSecurityLogsDir();

  if (!existsSync(logDir)) {
    return [];
  }

  const startStr = startDate?.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const entries: LogEntry[] = [];
  const files = readdirSync(logDir);

  for (const file of files) {
    // Match log file pattern: security-YYYY-MM-DD.log
    const match = file.match(/^security-(\d{4}-\d{2}-\d{2})\.log$/);
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
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        try {
          const entry = JSON.parse(line) as LogEntry;
          entries.push(entry);
        } catch (parseError) {
          console.error(`Failed to parse log line: ${line}`, parseError);
        }
      }
    } catch (readError) {
      console.error(`Failed to read log file: ${filePath}`, readError);
    }
  }

  return entries;
}

/**
 * Collect comprehensive security metrics for a time period
 *
 * @param daysBack - Number of days to look back (default: 30)
 * @returns Security metrics
 *
 * @example
 * ```typescript
 * const metrics = collectSecurityMetrics(7); // Last 7 days
 * console.log(`Total attempts: ${metrics.totalAttempts}`);
 * console.log(`Most common pattern: ${metrics.mostCommonPattern}`);
 * ```
 */
export function collectSecurityMetrics(daysBack = 30): SecurityMetrics {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get injection attempts data
  const attempts = readInjectionAttempts(startDate, endDate);
  const patternCounts = countAttemptsByPattern(startDate, endDate);
  const workflowCounts = countAttemptsByWorkflow(startDate, endDate);
  const uniqueUsers = getUniqueUsersWithAttempts(startDate, endDate);

  // Count blocked attempts
  const blockedAttempts = attempts.filter((a) => a.blocked).length;

  // Convert pattern counts to plain object
  const patternBreakdown: Record<string, number> = {};
  patternCounts.forEach((count, pattern) => {
    patternBreakdown[pattern] = count;
  });

  // Convert workflow counts to plain object
  const workflowBreakdown: Record<string, number> = {};
  workflowCounts.forEach((count, workflow) => {
    workflowBreakdown[workflow] = count;
  });

  // Generate time-series data (daily counts)
  const timeSeriesData = generateTimeSeriesData(attempts, startDate, endDate);

  // Calculate averages
  const avgAttemptsPerDay = attempts.length / daysBack;

  // Find most common pattern
  let mostCommonPattern: InjectionPattern | null = null;
  let maxPatternCount = 0;
  patternCounts.forEach((count, pattern) => {
    if (count > maxPatternCount) {
      maxPatternCount = count;
      mostCommonPattern = pattern;
    }
  });

  // Find most targeted workflow
  let mostTargetedWorkflow: WorkflowType | null = null;
  let maxWorkflowCount = 0;
  workflowCounts.forEach((count, workflow) => {
    if (count > maxWorkflowCount) {
      maxWorkflowCount = count;
      mostTargetedWorkflow = workflow;
    }
  });

  // Count blocked users
  const blockedUsers = countBlockedUsers();

  return {
    totalAttempts: attempts.length,
    blockedAttempts,
    uniqueUsers: uniqueUsers.length,
    blockedUsers,
    patternBreakdown: patternBreakdown as Record<InjectionPattern, number>,
    workflowBreakdown: workflowBreakdown as Record<WorkflowType, number>,
    timeSeriesData,
    avgAttemptsPerDay,
    mostCommonPattern,
    mostTargetedWorkflow,
  };
}

/**
 * Generate time-series data from injection attempts
 */
function generateTimeSeriesData(
  attempts: any[],
  startDate: Date,
  endDate: Date,
): Array<{ date: string; attempts: number }> {
  const dailyCounts = new Map<string, number>();

  // Initialize all dates in range with 0
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    dailyCounts.set(dateStr, 0);
    current.setDate(current.getDate() + 1);
  }

  // Count attempts per day
  for (const attempt of attempts) {
    const dateStr = attempt.timestamp.split('T')[0];
    const count = dailyCounts.get(dateStr) ?? 0;
    dailyCounts.set(dateStr, count + 1);
  }

  // Convert to array and sort by date
  const result = Array.from(dailyCounts.entries())
    .map(([date, attempts]) => ({ date, attempts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

/**
 * Count number of users currently blocked by rate limiting
 */
function countBlockedUsers(): number {
  const trackedUsers = getTrackedEntities('user');
  let blockedCount = 0;

  for (const user of trackedUsers) {
    const status = getRateLimitStatus(user, 'user');
    if (status) {
      const config = { maxAttempts: 5, windowMinutes: 60 }; // Default config
      if (status.attempts >= config.maxAttempts) {
        blockedCount++;
      }
    }
  }

  return blockedCount;
}

/**
 * Collect log statistics for a time period
 *
 * @param daysBack - Number of days to look back (default: 30)
 * @returns Log statistics
 *
 * @example
 * ```typescript
 * const stats = collectLogStatistics(7);
 * console.log(`Total log entries: ${stats.totalEntries}`);
 * console.log(`Critical events: ${stats.criticalEvents}`);
 * ```
 */
export function collectLogStatistics(daysBack = 30): LogStatistics {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const entries = readLogEntries(startDate, endDate);

  const levelBreakdown: Record<LogLevel, number> = {
    INFO: 0,
    WARN: 0,
    ERROR: 0,
    CRITICAL: 0,
  };

  const categoryBreakdown: Record<LogCategory, number> = {
    injection: 0,
    validation: 0,
    'rate-limit': 0,
    alert: 0,
    system: 0,
  };

  let criticalEvents = 0;
  let errors = 0;
  let warnings = 0;

  for (const entry of entries) {
    levelBreakdown[entry.level]++;
    categoryBreakdown[entry.category]++;

    if (entry.level === 'CRITICAL') criticalEvents++;
    if (entry.level === 'ERROR') errors++;
    if (entry.level === 'WARN') warnings++;
  }

  return {
    totalEntries: entries.length,
    levelBreakdown,
    categoryBreakdown,
    criticalEvents,
    errors,
    warnings,
  };
}

/**
 * Get metrics for a specific time range
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Security metrics
 */
export function getMetricsForTimeRange(startDate: Date, endDate: Date): SecurityMetrics {
  const daysBack = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return collectSecurityMetrics(daysBack);
}

/**
 * Get top users by injection attempts
 *
 * @param limit - Maximum number of users to return
 * @param daysBack - Number of days to look back
 * @returns Array of user/count pairs sorted by count (descending)
 */
export function getTopUsersByAttempts(
  limit = 10,
  daysBack = 30,
): Array<{ user: string; attempts: number }> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const attempts = readInjectionAttempts(startDate, endDate);
  const userCounts = new Map<string, number>();

  for (const attempt of attempts) {
    const count = userCounts.get(attempt.user) ?? 0;
    userCounts.set(attempt.user, count + 1);
  }

  return Array.from(userCounts.entries())
    .map(([user, attempts]) => ({ user, attempts }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, limit);
}
