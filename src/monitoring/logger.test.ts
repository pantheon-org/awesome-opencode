/**
 * Tests for security logging infrastructure
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, mkdirSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SecurityLogger, LogLevel } from './logger';
import type { LogEntry } from './logger';

describe('SecurityLogger', () => {
  const testLogDir = join(process.cwd(), 'data', 'test-logs');
  let logger: SecurityLogger;

  beforeEach(() => {
    // Create test log directory
    if (!existsSync(testLogDir)) {
      mkdirSync(testLogDir, { recursive: true });
    }
    logger = new SecurityLogger(testLogDir);
  });

  afterEach(() => {
    // Clean up test logs
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('log()', () => {
    test('should create log file on first write', () => {
      logger.log(LogLevel.INFO, 'system', 'Test message');

      const files = readdirSync(testLogDir);
      expect(files.length).toBe(1);
      expect(files[0]).toMatch(/^security-\d{4}-\d{2}-\d{2}\.log$/);
    });

    test('should write valid JSON log entry', () => {
      const testContext = { user: 'testuser', action: 'test' };
      logger.log(LogLevel.WARN, 'injection', 'Test injection detected', testContext);

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as LogEntry;

      expect(entry.level).toBe(LogLevel.WARN);
      expect(entry.category).toBe('injection');
      expect(entry.message).toBe('Test injection detected');
      expect(entry.context).toEqual(testContext);
      expect(entry.timestamp).toBeDefined();
    });

    test('should append multiple log entries to same file', () => {
      logger.log(LogLevel.INFO, 'system', 'First message');
      logger.log(LogLevel.WARN, 'validation', 'Second message');
      logger.log(LogLevel.ERROR, 'alert', 'Third message');

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(3);

      const entries = lines.map((line) => JSON.parse(line) as LogEntry);
      expect(entries[0].level).toBe(LogLevel.INFO);
      expect(entries[1].level).toBe(LogLevel.WARN);
      expect(entries[2].level).toBe(LogLevel.ERROR);
    });

    test('should handle empty context', () => {
      logger.log(LogLevel.INFO, 'system', 'No context message');

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as LogEntry;

      expect(entry.context).toEqual({});
    });

    test('should handle complex context objects', () => {
      const complexContext = {
        user: 'testuser',
        nested: {
          deep: {
            value: 'test',
          },
        },
        array: [1, 2, 3],
        number: 42,
        boolean: true,
      };

      logger.log(LogLevel.INFO, 'system', 'Complex context', complexContext);

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as LogEntry;

      expect(entry.context).toEqual(complexContext);
    });
  });

  describe('logInjectionAttempt()', () => {
    test('should log injection attempt with all fields', () => {
      logger.logInjectionAttempt('testuser', 'triage', 'role-switching', true, 42);

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as LogEntry;

      expect(entry.level).toBe(LogLevel.WARN);
      expect(entry.category).toBe('injection');
      expect(entry.message).toBe('Injection attempt detected');
      expect(entry.context.user).toBe('testuser');
      expect(entry.context.workflow).toBe('triage');
      expect(entry.context.pattern).toBe('role-switching');
      expect(entry.context.blocked).toBe(true);
      expect(entry.context.issueNumber).toBe(42);
    });

    test('should handle optional issue number', () => {
      logger.logInjectionAttempt('testuser', 'categorize', 'delimiter-injection', false);

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as LogEntry;

      expect(entry.context.issueNumber).toBeUndefined();
    });
  });

  describe('logValidationFailure()', () => {
    test('should log validation failure with errors', () => {
      const errors = ['Invalid schema', 'Missing required field'];
      logger.logValidationFailure('data/themes.json', errors);

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as LogEntry;

      expect(entry.level).toBe(LogLevel.ERROR);
      expect(entry.category).toBe('validation');
      expect(entry.message).toBe('Data validation failed');
      expect(entry.context.file).toBe('data/themes.json');
      expect(entry.context.errors).toEqual(errors);
      expect(entry.context.errorCount).toBe(2);
    });
  });

  describe('logRateLimit()', () => {
    test('should log blocked rate limit event', () => {
      logger.logRateLimit('testuser', 'user', true, 10);

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as LogEntry;

      expect(entry.level).toBe(LogLevel.ERROR);
      expect(entry.category).toBe('rate-limit');
      expect(entry.message).toBe('Rate limit exceeded');
      expect(entry.context.entityId).toBe('testuser');
      expect(entry.context.scope).toBe('user');
      expect(entry.context.blocked).toBe(true);
      expect(entry.context.attempts).toBe(10);
    });

    test('should log warning for non-blocked rate limit event', () => {
      logger.logRateLimit('testuser', 'user', false, 3);

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as LogEntry;

      expect(entry.level).toBe(LogLevel.WARN);
      expect(entry.message).toBe('Rate limit warning');
    });
  });

  describe('logAlert()', () => {
    test('should log critical alert', () => {
      logger.logAlert('issue-created', 'critical', 'Critical security issue', {
        issueNumber: 99,
      });

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as LogEntry;

      expect(entry.level).toBe(LogLevel.CRITICAL);
      expect(entry.category).toBe('alert');
      expect(entry.context.alertType).toBe('issue-created');
      expect(entry.context.severity).toBe('critical');
    });

    test('should log error for high severity alert', () => {
      logger.logAlert('webhook-sent', 'high', 'High priority alert');

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as LogEntry;

      expect(entry.level).toBe(LogLevel.ERROR);
    });
  });

  describe('logSystemEvent()', () => {
    test('should log system event', () => {
      logger.logSystemEvent('System initialized', { version: '1.0.0' });

      const files = readdirSync(testLogDir);
      const logFile = join(testLogDir, files[0]);
      const content = readFileSync(logFile, 'utf-8');
      const entry = JSON.parse(content.trim()) as LogEntry;

      expect(entry.level).toBe(LogLevel.INFO);
      expect(entry.category).toBe('system');
      expect(entry.message).toBe('System initialized');
      expect(entry.context.version).toBe('1.0.0');
    });
  });

  describe('cleanupOldLogs()', () => {
    test('should remove logs older than retention period', () => {
      // Create old log files
      const oldDate1 = new Date();
      oldDate1.setDate(oldDate1.getDate() - 35);
      const oldDate2 = new Date();
      oldDate2.setDate(oldDate2.getDate() - 40);

      const oldFile1 = join(testLogDir, `security-${oldDate1.toISOString().split('T')[0]}.log`);
      const oldFile2 = join(testLogDir, `security-${oldDate2.toISOString().split('T')[0]}.log`);

      require('node:fs').writeFileSync(oldFile1, 'old log 1\n');
      require('node:fs').writeFileSync(oldFile2, 'old log 2\n');

      // Create recent log
      logger.log(LogLevel.INFO, 'system', 'Recent log');

      // Clean up with 30-day retention
      const deleted = logger.cleanupOldLogs(30);

      expect(deleted).toBe(2);

      const remainingFiles = readdirSync(testLogDir);
      expect(remainingFiles.length).toBe(1);
    });

    test('should not remove recent logs', () => {
      logger.log(LogLevel.INFO, 'system', 'Recent log 1');
      logger.log(LogLevel.INFO, 'system', 'Recent log 2');

      const deleted = logger.cleanupOldLogs(30);

      expect(deleted).toBe(0);

      const files = readdirSync(testLogDir);
      expect(files.length).toBe(1);
    });

    test('should return 0 if log directory does not exist', () => {
      const nonExistentLogger = new SecurityLogger(join(testLogDir, 'nonexistent'));
      const deleted = nonExistentLogger.cleanupOldLogs();

      expect(deleted).toBe(0);
    });
  });

  describe('Integration', () => {
    test('should handle concurrent writes', () => {
      // Simulate concurrent writes
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve().then(() => {
            logger.log(LogLevel.INFO, 'system', `Concurrent message ${i}`);
          }),
        );
      }

      // Wait for all writes
      return Promise.all(promises).then(() => {
        const files = readdirSync(testLogDir);
        const logFile = join(testLogDir, files[0]);
        const content = readFileSync(logFile, 'utf-8');
        const lines = content.trim().split('\n');

        expect(lines.length).toBe(10);

        // Verify all entries are valid JSON
        lines.forEach((line) => {
          expect(() => JSON.parse(line)).not.toThrow();
        });
      });
    });
  });
});
