import { describe, expect, test } from 'bun:test';
import {
  WorkflowTypeSchema,
  InjectionPatternSchema,
  InjectionAttemptSchema,
  RateLimitConfigSchema,
  RateLimitEntrySchema,
  RateLimitStateSchema,
  RateLimitResultSchema,
  AlertConfigSchema,
  LogConfigSchema,
  SecurityConfigSchema,
  SecurityReportStatsSchema,
} from './types';

describe('WorkflowTypeSchema', () => {
  test('should parse valid workflow types', () => {
    expect(WorkflowTypeSchema.parse('triage')).toBe('triage');
    expect(WorkflowTypeSchema.parse('categorize')).toBe('categorize');
    expect(WorkflowTypeSchema.parse('validate')).toBe('validate');
  });

  test('should reject invalid workflow types', () => {
    expect(() => WorkflowTypeSchema.parse('invalid')).toThrow();
    expect(() => WorkflowTypeSchema.parse('')).toThrow();
  });
});

describe('InjectionPatternSchema', () => {
  test('should parse valid injection patterns', () => {
    const validPatterns = [
      'role-switching',
      'instruction-override',
      'delimiter-injection',
      'context-confusion',
      'encoded-payload',
      'url-injection',
      'unknown',
    ] as const;

    validPatterns.forEach((pattern) => {
      expect(InjectionPatternSchema.parse(pattern)).toBe(pattern);
    });
  });

  test('should reject invalid patterns', () => {
    expect(() => InjectionPatternSchema.parse('invalid-pattern')).toThrow();
  });
});

describe('InjectionAttemptSchema', () => {
  test('should parse valid injection attempt with all fields', () => {
    const validData = {
      timestamp: '2025-11-26T12:00:00Z',
      user: 'testuser',
      workflow: 'triage' as const,
      pattern: 'role-switching' as const,
      contentHash: 'abc12345',
      blocked: true,
      issueNumber: 42,
      repository: 'owner/repo',
    };

    const result = InjectionAttemptSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should parse valid injection attempt without optional fields', () => {
    const validData = {
      timestamp: '2025-11-26T12:00:00Z',
      user: 'testuser',
      workflow: 'triage' as const,
      pattern: 'unknown' as const,
      contentHash: 'def67890',
      blocked: false,
    };

    const result = InjectionAttemptSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should reject missing required fields', () => {
    const invalidData = {
      timestamp: '2025-11-26T12:00:00Z',
      user: 'testuser',
      // missing workflow, pattern, contentHash, blocked
    };

    expect(() => InjectionAttemptSchema.parse(invalidData)).toThrow();
  });

  test('should reject invalid workflow type', () => {
    const invalidData = {
      timestamp: '2025-11-26T12:00:00Z',
      user: 'testuser',
      workflow: 'invalid',
      pattern: 'role-switching',
      contentHash: 'abc12345',
      blocked: true,
    };

    expect(() => InjectionAttemptSchema.parse(invalidData)).toThrow();
  });

  test('should reject negative issue number', () => {
    const invalidData = {
      timestamp: '2025-11-26T12:00:00Z',
      user: 'testuser',
      workflow: 'triage',
      pattern: 'role-switching',
      contentHash: 'abc12345',
      blocked: true,
      issueNumber: -1,
    };

    expect(() => InjectionAttemptSchema.parse(invalidData)).toThrow();
  });
});

describe('RateLimitConfigSchema', () => {
  test('should parse valid rate limit config', () => {
    const validData = {
      maxAttempts: 5,
      windowMinutes: 60,
    };

    const result = RateLimitConfigSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should reject negative or zero values', () => {
    expect(() => RateLimitConfigSchema.parse({ maxAttempts: 0, windowMinutes: 60 })).toThrow();
    expect(() => RateLimitConfigSchema.parse({ maxAttempts: 5, windowMinutes: -1 })).toThrow();
  });

  test('should reject non-integer values', () => {
    expect(() => RateLimitConfigSchema.parse({ maxAttempts: 5.5, windowMinutes: 60 })).toThrow();
  });
});

describe('RateLimitEntrySchema', () => {
  test('should parse valid rate limit entry', () => {
    const validData = {
      attempts: 3,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
    };

    const result = RateLimitEntrySchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should allow zero attempts', () => {
    const validData = {
      attempts: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
    };

    const result = RateLimitEntrySchema.parse(validData);

    expect(result.attempts).toBe(0);
  });

  test('should reject negative values', () => {
    expect(() =>
      RateLimitEntrySchema.parse({
        attempts: -1,
        firstAttempt: Date.now(),
        lastAttempt: Date.now(),
      }),
    ).toThrow();
  });
});

describe('RateLimitStateSchema', () => {
  test('should parse valid rate limit state', () => {
    const validData = {
      user1: {
        attempts: 3,
        firstAttempt: Date.now(),
        lastAttempt: Date.now(),
      },
      user2: {
        attempts: 1,
        firstAttempt: Date.now(),
        lastAttempt: Date.now(),
      },
    };

    const result = RateLimitStateSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should parse empty state', () => {
    const result = RateLimitStateSchema.parse({});

    expect(result).toEqual({});
  });

  test('should reject invalid entries', () => {
    const invalidData = {
      user1: {
        attempts: 'not-a-number',
        firstAttempt: Date.now(),
        lastAttempt: Date.now(),
      },
    };

    expect(() => RateLimitStateSchema.parse(invalidData)).toThrow();
  });
});

describe('RateLimitResultSchema', () => {
  test('should parse valid rate limit result', () => {
    const validData = {
      allowed: true,
      remaining: 2,
      resetAt: '2025-11-26T13:00:00Z',
      blocked: false,
    };

    const result = RateLimitResultSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should reject negative remaining', () => {
    const invalidData = {
      allowed: true,
      remaining: -1,
      resetAt: '2025-11-26T13:00:00Z',
      blocked: false,
    };

    expect(() => RateLimitResultSchema.parse(invalidData)).toThrow();
  });
});

describe('AlertConfigSchema', () => {
  test('should parse valid alert config with webhook', () => {
    const validData = {
      enabled: true,
      createIssue: true,
      commentOnSource: false,
      webhookUrl: 'https://hooks.slack.com/services/XXXXX',
    };

    const result = AlertConfigSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should parse valid alert config with null webhook', () => {
    const validData = {
      enabled: true,
      createIssue: false,
      commentOnSource: true,
      webhookUrl: null,
    };

    const result = AlertConfigSchema.parse(validData);

    expect(result.webhookUrl).toBeNull();
  });

  test('should reject invalid webhook URL', () => {
    const invalidData = {
      enabled: true,
      createIssue: true,
      commentOnSource: false,
      webhookUrl: 'not-a-valid-url',
    };

    expect(() => AlertConfigSchema.parse(invalidData)).toThrow();
  });
});

describe('LogConfigSchema', () => {
  test('should parse valid log config', () => {
    const validData = {
      enabled: true,
      retentionDays: 30,
    };

    const result = LogConfigSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should reject zero or negative retention days', () => {
    expect(() => LogConfigSchema.parse({ enabled: true, retentionDays: 0 })).toThrow();
    expect(() => LogConfigSchema.parse({ enabled: true, retentionDays: -1 })).toThrow();
  });
});

describe('SecurityConfigSchema', () => {
  test('should parse valid security config', () => {
    const validData = {
      rateLimits: {
        perUser: {
          maxAttempts: 5,
          windowMinutes: 60,
        },
        perRepo: {
          maxAttempts: 20,
          windowMinutes: 1440,
        },
      },
      alerting: {
        enabled: true,
        createIssue: true,
        commentOnSource: false,
        webhookUrl: null,
      },
      logging: {
        enabled: true,
        retentionDays: 30,
      },
    };

    const result = SecurityConfigSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should reject missing required sections', () => {
    const invalidData = {
      rateLimits: {
        perUser: {
          maxAttempts: 5,
          windowMinutes: 60,
        },
      },
      // missing perRepo, alerting, logging
    };

    expect(() => SecurityConfigSchema.parse(invalidData)).toThrow();
  });
});

describe('SecurityReportStatsSchema', () => {
  test('should parse valid security report stats', () => {
    const validData = {
      totalAttempts: 10,
      uniqueUsers: 3,
      blockedUsers: 1,
      falsePositives: 0,
      patternBreakdown: [
        {
          pattern: 'role-switching' as const,
          count: 5,
          percentage: 50,
        },
        {
          pattern: 'url-injection' as const,
          count: 5,
          percentage: 50,
        },
      ],
      userActivity: [
        {
          user: 'user1',
          attempts: 5,
          status: 'blocked' as const,
        },
        {
          user: 'user2',
          attempts: 3,
          status: 'warned' as const,
        },
      ],
      timeRange: {
        start: '2025-11-01T00:00:00Z',
        end: '2025-11-26T23:59:59Z',
      },
    };

    const result = SecurityReportStatsSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should reject invalid percentage', () => {
    const invalidData = {
      totalAttempts: 10,
      uniqueUsers: 3,
      blockedUsers: 1,
      falsePositives: 0,
      patternBreakdown: [
        {
          pattern: 'role-switching',
          count: 5,
          percentage: 150, // Invalid: > 100
        },
      ],
      userActivity: [],
      timeRange: {
        start: '2025-11-01T00:00:00Z',
        end: '2025-11-26T23:59:59Z',
      },
    };

    expect(() => SecurityReportStatsSchema.parse(invalidData)).toThrow();
  });

  test('should reject negative counts', () => {
    const invalidData = {
      totalAttempts: -1,
      uniqueUsers: 3,
      blockedUsers: 1,
      falsePositives: 0,
      patternBreakdown: [],
      userActivity: [],
      timeRange: {
        start: '2025-11-01T00:00:00Z',
        end: '2025-11-26T23:59:59Z',
      },
    };

    expect(() => SecurityReportStatsSchema.parse(invalidData)).toThrow();
  });

  test('should reject invalid user status', () => {
    const invalidData = {
      totalAttempts: 10,
      uniqueUsers: 1,
      blockedUsers: 0,
      falsePositives: 0,
      patternBreakdown: [],
      userActivity: [
        {
          user: 'user1',
          attempts: 5,
          status: 'invalid-status',
        },
      ],
      timeRange: {
        start: '2025-11-01T00:00:00Z',
        end: '2025-11-26T23:59:59Z',
      },
    };

    expect(() => SecurityReportStatsSchema.parse(invalidData)).toThrow();
  });
});
