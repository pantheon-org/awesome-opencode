/**
 * Tests for security alerting module
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  createSecurityAlert,
  postSecurityWarning,
  addSecurityLabels,
  blockIssue,
  handleSecurityIncident,
} from './alert';
import type { SecurityAlertParams } from './types';

describe('Security Alerting Module', () => {
  let createCalls: Array<Record<string, unknown>> = [];
  let commentCalls: Array<Record<string, unknown>> = [];
  let labelCalls: Array<Record<string, unknown>> = [];
  let updateCalls: Array<Record<string, unknown>> = [];
  let lockCalls: Array<Record<string, unknown>> = [];

  // Mock GitHub client
  const mockGitHub = {
    rest: {
      issues: {
        create: (params: Record<string, unknown>) => {
          createCalls.push(params);
          return Promise.resolve({ data: { number: 123 } });
        },
        createComment: (params: Record<string, unknown>) => {
          commentCalls.push(params);
          return Promise.resolve({ data: {} });
        },
        addLabels: (params: Record<string, unknown>) => {
          labelCalls.push(params);
          return Promise.resolve({ data: {} });
        },
        update: (params: Record<string, unknown>) => {
          updateCalls.push(params);
          return Promise.resolve({ data: {} });
        },
        lock: (params: Record<string, unknown>) => {
          lockCalls.push(params);
          return Promise.resolve({ data: {} });
        },
      },
    },
  };

  // Mock context
  const mockContext = {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo',
    },
  };

  // Base alert params
  const baseParams: SecurityAlertParams = {
    github: mockGitHub,
    context: mockContext,
    user: 'testuser',
    attempts: 5,
    patterns: ['role-switching', 'instruction-override'],
    issueNumber: 123,
  };

  beforeEach(() => {
    // Clear call tracking
    createCalls = [];
    commentCalls = [];
    labelCalls = [];
    updateCalls = [];
    lockCalls = [];
  });

  describe('createSecurityAlert', () => {
    test('creates security issue with correct parameters', async () => {
      await createSecurityAlert(baseParams);

      expect(createCalls.length).toBe(1);
      expect(createCalls[0].owner).toBe('test-owner');
      expect(createCalls[0].repo).toBe('test-repo');
      expect(createCalls[0].title).toContain('@testuser');
      expect(createCalls[0].body).toContain('testuser');
      expect(createCalls[0].body).toContain('5');
      expect(createCalls[0].body).toContain('Role Switching');
      expect(createCalls[0].labels).toContain('security');
      expect(createCalls[0].labels).toContain('prompt-injection');
    });

    test('includes issue reference when provided', async () => {
      await createSecurityAlert(baseParams);

      expect(createCalls[0].body).toContain('#123');
    });

    test('handles missing issue number', async () => {
      const params = { ...baseParams, issueNumber: undefined };
      await createSecurityAlert(params);

      expect(createCalls[0].body).toContain('multiple submissions');
    });
  });

  describe('postSecurityWarning', () => {
    test('posts warning comment on issue', async () => {
      await postSecurityWarning(baseParams);

      expect(commentCalls.length).toBe(1);
      expect(commentCalls[0].owner).toBe('test-owner');
      expect(commentCalls[0].repo).toBe('test-repo');
      expect(commentCalls[0].issue_number).toBe(123);
      expect(commentCalls[0].body).toContain('testuser');
      expect(commentCalls[0].body).toContain('Security Warning');
    });

    test('does not post comment when issue number is missing', async () => {
      const params = { ...baseParams, issueNumber: undefined };
      await postSecurityWarning(params);

      expect(commentCalls.length).toBe(0);
    });

    test('includes detected patterns in warning', async () => {
      await postSecurityWarning(baseParams);

      expect(commentCalls[0].body).toContain('Role Switching');
      expect(commentCalls[0].body).toContain('Instruction Override');
    });
  });

  describe('addSecurityLabels', () => {
    test('adds security labels to issue', async () => {
      await addSecurityLabels(baseParams);

      expect(labelCalls.length).toBe(1);
      expect(labelCalls[0].owner).toBe('test-owner');
      expect(labelCalls[0].repo).toBe('test-repo');
      expect(labelCalls[0].issue_number).toBe(123);
      expect(labelCalls[0].labels).toContain('security-flagged');
      expect(labelCalls[0].labels).toContain('needs-review');
    });

    test('does not add labels when issue number is missing', async () => {
      const params = { ...baseParams, issueNumber: undefined };
      await addSecurityLabels(params);

      expect(labelCalls.length).toBe(0);
    });
  });

  describe('blockIssue', () => {
    test('closes and locks issue', async () => {
      await blockIssue(baseParams);

      expect(updateCalls.length).toBe(1);
      expect(lockCalls.length).toBe(1);
      expect(commentCalls.length).toBe(1);

      expect(updateCalls[0].state).toBe('closed');
      expect(updateCalls[0].labels).toContain('security-blocked');
      expect(lockCalls[0].lock_reason).toBe('spam');
    });

    test('does not block when issue number is missing', async () => {
      const params = { ...baseParams, issueNumber: undefined };
      await blockIssue(params);

      expect(updateCalls.length).toBe(0);
      expect(lockCalls.length).toBe(0);
    });
  });

  describe('handleSecurityIncident', () => {
    test('handles low severity incident', async () => {
      await handleSecurityIncident(baseParams, 'low');

      // Should add labels and post warning
      expect(labelCalls.length).toBe(1);
      expect(commentCalls.length).toBe(1);

      // Should not create alert or block
      expect(createCalls.length).toBe(0);
      expect(updateCalls.length).toBe(0);
    });

    test('handles medium severity incident', async () => {
      await handleSecurityIncident(baseParams, 'medium');

      // Should add labels, post warning, and create alert
      expect(labelCalls.length).toBe(1);
      expect(commentCalls.length).toBe(1);
      expect(createCalls.length).toBe(1);

      // Should not block
      expect(updateCalls.length).toBe(0);
      expect(lockCalls.length).toBe(0);
    });

    test('handles high severity incident', async () => {
      await handleSecurityIncident(baseParams, 'high');

      // Should do everything: labels, warning, alert, and block
      expect(labelCalls.length).toBe(1);
      expect(createCalls.length).toBe(1);
      expect(commentCalls.length).toBe(2); // Warning + block comment
      expect(updateCalls.length).toBe(1);
      expect(lockCalls.length).toBe(1);
    });

    test('defaults to medium severity', async () => {
      await handleSecurityIncident(baseParams);

      // Should behave like medium severity
      expect(labelCalls.length).toBe(1);
      expect(commentCalls.length).toBe(1);
      expect(createCalls.length).toBe(1);
      expect(updateCalls.length).toBe(0);
    });
  });
});
