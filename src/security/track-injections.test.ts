/**
 * Tests for injection tracking module
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  trackInjectionAttempt,
  cleanupOldLogs,
  readInjectionAttempts,
  getInjectionAttemptsByUser,
  getUniqueUsersWithAttempts,
  countAttemptsByPattern,
  countAttemptsByWorkflow,
  generateContentHash,
  ensureSecurityLogsDir,
  getLogFilePath,
} from './track-injections';
import type { InjectionAttempt } from './types';

const TEST_LOGS_DIR = join(process.cwd(), 'data', 'security-logs');

describe('Injection Tracking Module', () => {
  beforeEach(() => {
    // Clean up logs directory before each test
    if (existsSync(TEST_LOGS_DIR)) {
      rmSync(TEST_LOGS_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(TEST_LOGS_DIR)) {
      rmSync(TEST_LOGS_DIR, { recursive: true, force: true });
    }
  });

  describe('generateContentHash', () => {
    test('generates consistent hash for same content', () => {
      const content = 'test content';
      const hash1 = generateContentHash(content);
      const hash2 = generateContentHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(8);
    });

    test('generates different hashes for different content', () => {
      const hash1 = generateContentHash('content1');
      const hash2 = generateContentHash('content2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('ensureSecurityLogsDir', () => {
    test('creates logs directory if it does not exist', () => {
      expect(existsSync(TEST_LOGS_DIR)).toBe(false);

      ensureSecurityLogsDir();

      expect(existsSync(TEST_LOGS_DIR)).toBe(true);
    });

    test('does not error if directory already exists', () => {
      ensureSecurityLogsDir();
      expect(existsSync(TEST_LOGS_DIR)).toBe(true);

      // Call again - should not throw
      expect(() => ensureSecurityLogsDir()).not.toThrow();
    });
  });

  describe('getLogFilePath', () => {
    test('returns path with correct format', () => {
      const date = new Date('2025-11-25');
      const path = getLogFilePath(date);

      expect(path).toContain('injections-2025-11-25.jsonl');
      expect(path).toContain('security-logs');
    });

    test('uses today by default', () => {
      const path = getLogFilePath();
      const today = new Date().toISOString().split('T')[0];

      expect(path).toContain(`injections-${today}.jsonl`);
    });
  });

  describe('trackInjectionAttempt', () => {
    test('creates log file and tracks attempt', () => {
      const attempt: InjectionAttempt = {
        timestamp: new Date().toISOString(),
        user: 'testuser',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'abc12345',
        blocked: false,
      };

      trackInjectionAttempt(attempt);

      const logFile = getLogFilePath();
      expect(existsSync(logFile)).toBe(true);
    });

    test('appends multiple attempts to same file', () => {
      const attempt1: InjectionAttempt = {
        timestamp: new Date().toISOString(),
        user: 'user1',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash1',
        blocked: false,
      };

      const attempt2: InjectionAttempt = {
        timestamp: new Date().toISOString(),
        user: 'user2',
        workflow: 'categorize',
        pattern: 'instruction-override',
        contentHash: 'hash2',
        blocked: true,
      };

      trackInjectionAttempt(attempt1);
      trackInjectionAttempt(attempt2);

      const attempts = readInjectionAttempts();
      expect(attempts).toHaveLength(2);
      expect(attempts[0].user).toBe('user1');
      expect(attempts[1].user).toBe('user2');
    });

    test('tracks attempts with optional fields', () => {
      const attempt: InjectionAttempt = {
        timestamp: new Date().toISOString(),
        user: 'testuser',
        workflow: 'validate',
        pattern: 'delimiter-injection',
        contentHash: 'xyz789',
        blocked: true,
        issueNumber: 123,
        repository: 'test/repo',
      };

      trackInjectionAttempt(attempt);

      const attempts = readInjectionAttempts();
      expect(attempts[0].issueNumber).toBe(123);
      expect(attempts[0].repository).toBe('test/repo');
    });
  });

  describe('readInjectionAttempts', () => {
    test('returns empty array when no logs exist', () => {
      const attempts = readInjectionAttempts();
      expect(attempts).toEqual([]);
    });

    test('reads all attempts from log files', () => {
      // Track some attempts
      for (let i = 0; i < 5; i++) {
        trackInjectionAttempt({
          timestamp: new Date().toISOString(),
          user: `user${i}`,
          workflow: 'triage',
          pattern: 'role-switching',
          contentHash: `hash${i}`,
          blocked: false,
        });
      }

      const attempts = readInjectionAttempts();
      expect(attempts).toHaveLength(5);
    });

    test('filters by date range', () => {
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Track attempt today
      trackInjectionAttempt({
        timestamp: today.toISOString(),
        user: 'user1',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash1',
        blocked: false,
      });

      // Read with date range (should include today)
      const attempts = readInjectionAttempts(yesterday, tomorrow);
      expect(attempts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getInjectionAttemptsByUser', () => {
    test('returns only attempts for specified user', () => {
      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'alice',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash1',
        blocked: false,
      });

      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'bob',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash2',
        blocked: false,
      });

      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'alice',
        workflow: 'categorize',
        pattern: 'instruction-override',
        contentHash: 'hash3',
        blocked: false,
      });

      const aliceAttempts = getInjectionAttemptsByUser('alice');
      expect(aliceAttempts).toHaveLength(2);
      expect(aliceAttempts.every((a) => a.user === 'alice')).toBe(true);

      const bobAttempts = getInjectionAttemptsByUser('bob');
      expect(bobAttempts).toHaveLength(1);
    });
  });

  describe('getUniqueUsersWithAttempts', () => {
    test('returns unique list of users', () => {
      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'alice',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash1',
        blocked: false,
      });

      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'bob',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash2',
        blocked: false,
      });

      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'alice',
        workflow: 'categorize',
        pattern: 'instruction-override',
        contentHash: 'hash3',
        blocked: false,
      });

      const users = getUniqueUsersWithAttempts();
      expect(users).toHaveLength(2);
      expect(users).toContain('alice');
      expect(users).toContain('bob');
    });
  });

  describe('countAttemptsByPattern', () => {
    test('counts attempts by pattern correctly', () => {
      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'user1',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash1',
        blocked: false,
      });

      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'user2',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash2',
        blocked: false,
      });

      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'user3',
        workflow: 'categorize',
        pattern: 'instruction-override',
        contentHash: 'hash3',
        blocked: false,
      });

      const counts = countAttemptsByPattern();
      expect(counts.get('role-switching')).toBe(2);
      expect(counts.get('instruction-override')).toBe(1);
    });
  });

  describe('countAttemptsByWorkflow', () => {
    test('counts attempts by workflow correctly', () => {
      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'user1',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash1',
        blocked: false,
      });

      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'user2',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash2',
        blocked: false,
      });

      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'user3',
        workflow: 'categorize',
        pattern: 'instruction-override',
        contentHash: 'hash3',
        blocked: false,
      });

      const counts = countAttemptsByWorkflow();
      expect(counts.get('triage')).toBe(2);
      expect(counts.get('categorize')).toBe(1);
    });
  });

  describe('cleanupOldLogs', () => {
    test('removes logs older than retention period', () => {
      // Create old log file (31 days ago)
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      const oldDateStr = oldDate.toISOString().split('T')[0];
      const oldLogFile = join(TEST_LOGS_DIR, `injections-${oldDateStr}.jsonl`);

      ensureSecurityLogsDir();
      require('node:fs').writeFileSync(oldLogFile, '{}');

      // Create recent log file (today)
      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'user1',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash1',
        blocked: false,
      });

      // Cleanup with 30 day retention
      const deleted = cleanupOldLogs(30);

      expect(deleted).toBe(1);
      expect(existsSync(oldLogFile)).toBe(false);
      expect(existsSync(getLogFilePath())).toBe(true);
    });

    test('does not remove logs within retention period', () => {
      trackInjectionAttempt({
        timestamp: new Date().toISOString(),
        user: 'user1',
        workflow: 'triage',
        pattern: 'role-switching',
        contentHash: 'hash1',
        blocked: false,
      });

      const deleted = cleanupOldLogs(30);

      expect(deleted).toBe(0);
      expect(existsSync(getLogFilePath())).toBe(true);
    });

    test('returns 0 when logs directory does not exist', () => {
      const deleted = cleanupOldLogs();
      expect(deleted).toBe(0);
    });
  });
});
