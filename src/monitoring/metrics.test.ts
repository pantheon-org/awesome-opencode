/**
 * Tests for security metrics collection
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  collectSecurityMetrics,
  collectLogStatistics,
  getTopUsersByAttempts,
  readLogEntries,
} from './metrics';
import { SecurityLogger, LogLevel } from './logger';
import { trackInjectionAttempt } from '../security/track-injections';
import type { InjectionAttempt } from '../security/types';

describe('Security Metrics', () => {
  const testLogDir = join(process.cwd(), 'data', 'test-logs');
  const testSecurityLogsDir = join(process.cwd(), 'data', 'security-logs');

  beforeEach(() => {
    // Create test directories
    [testLogDir, testSecurityLogsDir].forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  });

  afterEach(() => {
    // Clean up test data
    [testLogDir, testSecurityLogsDir].forEach((dir) => {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('readLogEntries()', () => {
    test('should return empty array if no logs exist', () => {
      const entries = readLogEntries();
      expect(entries).toEqual([]);
    });

    test('should read log entries from files', () => {
      const logger = new SecurityLogger(testSecurityLogsDir);
      logger.log(LogLevel.INFO, 'system', 'Test message 1');
      logger.log(LogLevel.WARN, 'injection', 'Test message 2');

      const entries = readLogEntries();
      expect(entries.length).toBe(2);
      expect(entries[0].message).toBe('Test message 1');
      expect(entries[1].message).toBe('Test message 2');
    });

    test('should filter logs by date range', () => {
      const logger = new SecurityLogger(testSecurityLogsDir);

      // Create logs for multiple days
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      logger.log(LogLevel.INFO, 'system', 'Today log');

      // Manually create yesterday's log file
      const yesterdayFile = join(
        testSecurityLogsDir,
        `security-${yesterday.toISOString().split('T')[0]}.log`,
      );
      writeFileSync(
        yesterdayFile,
        JSON.stringify({
          timestamp: yesterday.toISOString(),
          level: LogLevel.INFO,
          category: 'system',
          message: 'Yesterday log',
          context: {},
        }) + '\n',
      );

      // Read only today's logs
      const entries = readLogEntries(today);
      expect(entries.length).toBe(1);
      expect(entries[0].message).toBe('Today log');
    });

    test('should handle malformed log lines gracefully', () => {
      // Create log file with malformed content
      const logFile = join(
        testSecurityLogsDir,
        `security-${new Date().toISOString().split('T')[0]}.log`,
      );
      writeFileSync(logFile, 'invalid json\n{"valid": "entry"}\n');

      // Should not throw and should skip invalid lines
      expect(() => readLogEntries()).not.toThrow();
    });
  });

  describe('collectSecurityMetrics()', () => {
    test('should return zero metrics when no data exists', () => {
      const metrics = collectSecurityMetrics(7);

      expect(metrics.totalAttempts).toBe(0);
      expect(metrics.blockedAttempts).toBe(0);
      expect(metrics.uniqueUsers).toBe(0);
      expect(metrics.avgAttemptsPerDay).toBe(0);
      expect(metrics.mostCommonPattern).toBeNull();
      expect(metrics.mostTargetedWorkflow).toBeNull();
    });

    test('should calculate correct metrics from injection data', () => {
      // Create sample injection attempts
      const attempts: InjectionAttempt[] = [
        {
          timestamp: new Date().toISOString(),
          user: 'user1',
          workflow: 'triage',
          pattern: 'role-switching',
          contentHash: 'hash1',
          blocked: true,
        },
        {
          timestamp: new Date().toISOString(),
          user: 'user2',
          workflow: 'triage',
          pattern: 'role-switching',
          contentHash: 'hash2',
          blocked: true,
        },
        {
          timestamp: new Date().toISOString(),
          user: 'user1',
          workflow: 'categorize',
          pattern: 'delimiter-injection',
          contentHash: 'hash3',
          blocked: false,
        },
      ];

      // Write injection attempts to log files
      attempts.forEach((attempt) => trackInjectionAttempt(attempt));

      const metrics = collectSecurityMetrics(7);

      expect(metrics.totalAttempts).toBe(3);
      expect(metrics.blockedAttempts).toBe(2);
      expect(metrics.uniqueUsers).toBe(2);
      expect(metrics.mostCommonPattern).toBe('role-switching');
      expect(metrics.mostTargetedWorkflow).toBe('triage');
    });

    test('should generate time series data', () => {
      // Create attempts for today
      const attempt: InjectionAttempt = {
        timestamp: new Date().toISOString(),
        user: 'user1',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash1',
        blocked: true,
      };

      trackInjectionAttempt(attempt);

      const metrics = collectSecurityMetrics(7);

      expect(metrics.timeSeriesData).toBeDefined();
      expect(metrics.timeSeriesData.length).toBeGreaterThanOrEqual(7); // At least 7 days of data
      expect(metrics.timeSeriesData[metrics.timeSeriesData.length - 1].attempts).toBe(1);
    });

    test('should calculate average attempts per day', () => {
      // Create 5 attempts over 5 days
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const attempt: InjectionAttempt = {
          timestamp: date.toISOString(),
          user: 'user1',
          workflow: 'triage',
          pattern: 'role-switching',
          contentHash: `hash${i}`,
          blocked: true,
        };

        trackInjectionAttempt(attempt);
      }

      const metrics = collectSecurityMetrics(30);

      expect(metrics.avgAttemptsPerDay).toBeCloseTo(5 / 30, 2);
    });
  });

  describe('collectLogStatistics()', () => {
    test('should return zero statistics when no logs exist', () => {
      const stats = collectLogStatistics(7);

      expect(stats.totalEntries).toBe(0);
      expect(stats.criticalEvents).toBe(0);
      expect(stats.errors).toBe(0);
      expect(stats.warnings).toBe(0);
    });

    test('should count log entries by level', () => {
      const logger = new SecurityLogger(testSecurityLogsDir);

      logger.log(LogLevel.INFO, 'system', 'Info message');
      logger.log(LogLevel.WARN, 'injection', 'Warning message');
      logger.log(LogLevel.ERROR, 'validation', 'Error message');
      logger.log(LogLevel.CRITICAL, 'alert', 'Critical message');

      const stats = collectLogStatistics(7);

      expect(stats.totalEntries).toBe(4);
      expect(stats.levelBreakdown[LogLevel.INFO]).toBe(1);
      expect(stats.levelBreakdown[LogLevel.WARN]).toBe(1);
      expect(stats.levelBreakdown[LogLevel.ERROR]).toBe(1);
      expect(stats.levelBreakdown[LogLevel.CRITICAL]).toBe(1);
      expect(stats.criticalEvents).toBe(1);
      expect(stats.errors).toBe(1);
      expect(stats.warnings).toBe(1);
    });

    test('should count log entries by category', () => {
      const logger = new SecurityLogger(testSecurityLogsDir);

      logger.log(LogLevel.INFO, 'system', 'System message');
      logger.log(LogLevel.WARN, 'injection', 'Injection message');
      logger.log(LogLevel.ERROR, 'validation', 'Validation message');
      logger.log(LogLevel.INFO, 'rate-limit', 'Rate limit message');
      logger.log(LogLevel.CRITICAL, 'alert', 'Alert message');

      const stats = collectLogStatistics(7);

      expect(stats.categoryBreakdown.system).toBe(1);
      expect(stats.categoryBreakdown.injection).toBe(1);
      expect(stats.categoryBreakdown.validation).toBe(1);
      expect(stats.categoryBreakdown['rate-limit']).toBe(1);
      expect(stats.categoryBreakdown.alert).toBe(1);
    });
  });

  describe('getTopUsersByAttempts()', () => {
    test('should return empty array when no attempts exist', () => {
      const topUsers = getTopUsersByAttempts(10, 7);
      expect(topUsers).toEqual([]);
    });

    test('should return top users sorted by attempt count', () => {
      // Create attempts from multiple users
      const users = ['user1', 'user2', 'user3'];
      const attemptCounts = [5, 3, 8];

      users.forEach((user, i) => {
        for (let j = 0; j < attemptCounts[i]; j++) {
          const attempt: InjectionAttempt = {
            timestamp: new Date().toISOString(),
            user,
            workflow: 'triage',
            pattern: 'role-switching',
            contentHash: `hash-${user}-${j}`,
            blocked: true,
          };
          trackInjectionAttempt(attempt);
        }
      });

      const topUsers = getTopUsersByAttempts(3, 7);

      expect(topUsers.length).toBe(3);
      expect(topUsers[0].user).toBe('user3');
      expect(topUsers[0].attempts).toBe(8);
      expect(topUsers[1].user).toBe('user1');
      expect(topUsers[1].attempts).toBe(5);
      expect(topUsers[2].user).toBe('user2');
      expect(topUsers[2].attempts).toBe(3);
    });

    test('should respect limit parameter', () => {
      // Create attempts from 5 users
      for (let i = 0; i < 5; i++) {
        const attempt: InjectionAttempt = {
          timestamp: new Date().toISOString(),
          user: `user${i}`,
          workflow: 'triage',
          pattern: 'role-switching',
          contentHash: `hash${i}`,
          blocked: true,
        };
        trackInjectionAttempt(attempt);
      }

      const topUsers = getTopUsersByAttempts(3, 7);

      expect(topUsers.length).toBe(3);
    });
  });

  describe('Integration', () => {
    test('should handle mixed log and injection data', () => {
      const logger = new SecurityLogger(testSecurityLogsDir);

      // Create some logs
      logger.log(LogLevel.INFO, 'system', 'System initialized');
      logger.logInjectionAttempt('user1', 'triage', 'role-switching', true, 42);

      // Create some injection attempts
      const attempt: InjectionAttempt = {
        timestamp: new Date().toISOString(),
        user: 'user1',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash1',
        blocked: true,
      };
      trackInjectionAttempt(attempt);

      // Collect metrics
      const metrics = collectSecurityMetrics(7);
      const stats = collectLogStatistics(7);

      expect(metrics.totalAttempts).toBeGreaterThan(0);
      expect(stats.totalEntries).toBeGreaterThan(0);
    });
  });
});
