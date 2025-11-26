/**
 * Type definitions for security tracking, rate limiting, and alerting
 */

import { z } from 'zod';

/**
 * Zod schema for workflow types
 */
export const WorkflowTypeSchema = z.enum(['triage', 'categorize', 'validate']);

/**
 * Inferred TypeScript type from the Zod schema
 */
export type WorkflowType = z.infer<typeof WorkflowTypeSchema>;

/**
 * Zod schema for injection pattern types
 */
export const InjectionPatternSchema = z.enum([
  'role-switching',
  'instruction-override',
  'delimiter-injection',
  'context-confusion',
  'encoded-payload',
  'url-injection',
  'unknown',
]);

/**
 * Inferred TypeScript type from the Zod schema
 */
export type InjectionPattern = z.infer<typeof InjectionPatternSchema>;

/**
 * Zod schema for individual injection attempt record
 */
export const InjectionAttemptSchema = z.object({
  timestamp: z.string().describe('ISO 8601 timestamp'),
  user: z.string().describe('GitHub username'),
  workflow: WorkflowTypeSchema.describe('Type of workflow where injection was detected'),
  pattern: InjectionPatternSchema.describe('Primary pattern detected'),
  contentHash: z.string().describe('SHA-256 hash of content (first 8 chars for privacy)'),
  blocked: z.boolean().describe('Whether the attempt was blocked or just logged'),
  issueNumber: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Issue or PR number where injection occurred'),
  repository: z
    .string()
    .optional()
    .describe('Repository where injection occurred (if cross-repo tracking)'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type InjectionAttempt = z.infer<typeof InjectionAttemptSchema>;

/**
 * Zod schema for rate limit configuration per entity (user or repo)
 */
export const RateLimitConfigSchema = z.object({
  maxAttempts: z.number().int().positive().describe('Maximum number of attempts allowed'),
  windowMinutes: z.number().int().positive().describe('Time window in minutes'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

/**
 * Zod schema for rate limit state for a single user
 */
export const RateLimitEntrySchema = z.object({
  attempts: z.number().int().nonnegative().describe('Number of attempts in current window'),
  firstAttempt: z
    .number()
    .int()
    .nonnegative()
    .describe('Timestamp of first attempt in current window (milliseconds)'),
  lastAttempt: z.number().int().nonnegative().describe('Timestamp of last attempt (milliseconds)'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type RateLimitEntry = z.infer<typeof RateLimitEntrySchema>;

/**
 * Zod schema for rate limit state storage (in-memory or file-based)
 */
export const RateLimitStateSchema = z.record(z.string(), RateLimitEntrySchema);

/**
 * Inferred TypeScript type from the Zod schema
 */
export type RateLimitState = z.infer<typeof RateLimitStateSchema>;

/**
 * Zod schema for result of rate limit check
 */
export const RateLimitResultSchema = z.object({
  allowed: z.boolean().describe('Whether the request is allowed'),
  remaining: z
    .number()
    .int()
    .nonnegative()
    .describe('Number of remaining attempts in current window'),
  resetAt: z.string().describe('Timestamp when window resets (ISO 8601)'),
  blocked: z.boolean().describe('Whether this user has been blocked'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type RateLimitResult = z.infer<typeof RateLimitResultSchema>;

/**
 * Zod schema for alerting configuration
 */
export const AlertConfigSchema = z.object({
  enabled: z.boolean().describe('Whether alerting is enabled'),
  createIssue: z.boolean().describe('Whether to create a GitHub issue for alerts'),
  commentOnSource: z.boolean().describe('Whether to comment on the source issue/PR'),
  webhookUrl: z
    .string()
    .url()
    .nullable()
    .describe('Optional webhook URL for external alerts (Slack, Discord, etc)'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type AlertConfig = z.infer<typeof AlertConfigSchema>;

/**
 * Zod schema for logging configuration
 */
export const LogConfigSchema = z.object({
  enabled: z.boolean().describe('Whether logging is enabled'),
  retentionDays: z.number().int().positive().describe('Number of days to retain logs'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type LogConfig = z.infer<typeof LogConfigSchema>;

/**
 * Zod schema for complete security configuration
 */
export const SecurityConfigSchema = z.object({
  rateLimits: z
    .object({
      perUser: RateLimitConfigSchema.describe('Per-user rate limits'),
      perRepo: RateLimitConfigSchema.describe('Per-repository rate limits'),
    })
    .describe('Rate limiting configuration'),
  alerting: AlertConfigSchema.describe('Alerting configuration'),
  logging: LogConfigSchema.describe('Logging configuration'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

/**
 * GitHub REST API interface for issues
 * Note: These are API interfaces and kept as TypeScript interfaces for function signatures
 */
export interface GitHubIssuesAPI {
  create: (params: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    labels?: string[];
  }) => Promise<{ data: { number: number } }>;
  createComment: (params: {
    owner: string;
    repo: string;
    issue_number: number;
    body: string;
  }) => Promise<{ data: Record<string, unknown> }>;
  addLabels: (params: {
    owner: string;
    repo: string;
    issue_number: number;
    labels: string[];
  }) => Promise<{ data: Record<string, unknown> }>;
  update: (params: {
    owner: string;
    repo: string;
    issue_number: number;
    state: string;
    labels?: string[];
  }) => Promise<{ data: Record<string, unknown> }>;
  lock: (params: {
    owner: string;
    repo: string;
    issue_number: number;
    lock_reason: string;
  }) => Promise<{ data: Record<string, unknown> }>;
}

/**
 * GitHub API client interface
 * Note: This is an API interface and kept as TypeScript interface
 */
export interface GitHubClient {
  rest: {
    issues: GitHubIssuesAPI;
  };
}

/**
 * Zod schema for GitHub Actions context repo info
 */
const GitHubRepoSchema = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name'),
});

/**
 * Zod schema for GitHub Actions context
 */
export const GitHubContextSchema = z.object({
  repo: GitHubRepoSchema.describe('Repository information'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type GitHubContext = z.infer<typeof GitHubContextSchema>;

/**
 * Parameters for creating a security alert
 * Note: GitHub API client is kept as interface type, other fields use Zod validation
 */
export interface SecurityAlertParams {
  /** GitHub API client (from actions/github-script) */
  github: GitHubClient;
  /** GitHub Actions context */
  context: GitHubContext;
  /** Username who triggered alerts */
  user: string;
  /** Number of attempts detected */
  attempts: number;
  /** List of patterns detected */
  patterns: InjectionPattern[];
  /** Optional: Issue/PR number where injection occurred */
  issueNumber?: number;
}

/**
 * Zod schema for pattern breakdown in security report
 */
const PatternBreakdownSchema = z.object({
  pattern: InjectionPatternSchema.describe('Injection pattern type'),
  count: z.number().int().nonnegative().describe('Number of times this pattern was detected'),
  percentage: z.number().min(0).max(100).describe('Percentage of total attempts'),
});

/**
 * Zod schema for user activity in security report
 */
const UserActivitySchema = z.object({
  user: z.string().describe('GitHub username'),
  attempts: z.number().int().nonnegative().describe('Number of injection attempts'),
  status: z.enum(['active', 'warned', 'blocked', 'cleared']).describe('Current status of the user'),
});

/**
 * Zod schema for time range in security report
 */
const TimeRangeSchema = z.object({
  start: z.string().describe('Start timestamp (ISO 8601)'),
  end: z.string().describe('End timestamp (ISO 8601)'),
});

/**
 * Zod schema for security report statistics
 */
export const SecurityReportStatsSchema = z.object({
  totalAttempts: z.number().int().nonnegative().describe('Total injection attempts in period'),
  uniqueUsers: z.number().int().nonnegative().describe('Number of unique users'),
  blockedUsers: z.number().int().nonnegative().describe('Number of users blocked'),
  falsePositives: z.number().int().nonnegative().describe('Number of false positives identified'),
  patternBreakdown: z.array(PatternBreakdownSchema).describe('Pattern breakdown statistics'),
  userActivity: z.array(UserActivitySchema).describe('User activity statistics'),
  timeRange: TimeRangeSchema.describe('Time range of report'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type SecurityReportStats = z.infer<typeof SecurityReportStatsSchema>;
