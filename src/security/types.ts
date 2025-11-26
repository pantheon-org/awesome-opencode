/**
 * Type definitions for security tracking, rate limiting, and alerting
 */

/**
 * Workflow type where injection occurred
 */
export type WorkflowType = 'triage' | 'categorize' | 'validate';

/**
 * Injection pattern type detected
 */
export type InjectionPattern =
  | 'role-switching'
  | 'instruction-override'
  | 'delimiter-injection'
  | 'context-confusion'
  | 'encoded-payload'
  | 'url-injection'
  | 'unknown';

/**
 * Individual injection attempt record
 */
export interface InjectionAttempt {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** GitHub username */
  user: string;
  /** Type of workflow where injection was detected */
  workflow: WorkflowType;
  /** Primary pattern detected */
  pattern: InjectionPattern;
  /** SHA-256 hash of content (first 8 chars for privacy) */
  contentHash: string;
  /** Whether the attempt was blocked or just logged */
  blocked: boolean;
  /** Optional: Issue or PR number where injection occurred */
  issueNumber?: number;
  /** Optional: Repository where injection occurred (if cross-repo tracking) */
  repository?: string;
}

/**
 * Rate limit configuration per entity (user or repo)
 */
export interface RateLimitConfig {
  /** Maximum number of attempts allowed */
  maxAttempts: number;
  /** Time window in minutes */
  windowMinutes: number;
}

/**
 * Rate limit state for a single user
 */
export interface RateLimitEntry {
  /** Number of attempts in current window */
  attempts: number;
  /** Timestamp of first attempt in current window (milliseconds) */
  firstAttempt: number;
  /** Timestamp of last attempt (milliseconds) */
  lastAttempt: number;
}

/**
 * Rate limit state storage (in-memory or file-based)
 */
export interface RateLimitState {
  [userId: string]: RateLimitEntry;
}

/**
 * Result of rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining attempts in current window */
  remaining: number;
  /** Timestamp when window resets (ISO 8601) */
  resetAt: string;
  /** Whether this user has been blocked */
  blocked: boolean;
}

/**
 * Alerting configuration
 */
export interface AlertConfig {
  /** Whether alerting is enabled */
  enabled: boolean;
  /** Whether to create a GitHub issue for alerts */
  createIssue: boolean;
  /** Whether to comment on the source issue/PR */
  commentOnSource: boolean;
  /** Optional webhook URL for external alerts (Slack, Discord, etc) */
  webhookUrl: string | null;
}

/**
 * Logging configuration
 */
export interface LogConfig {
  /** Whether logging is enabled */
  enabled: boolean;
  /** Number of days to retain logs */
  retentionDays: number;
}

/**
 * Complete security configuration
 */
export interface SecurityConfig {
  /** Rate limiting configuration */
  rateLimits: {
    /** Per-user rate limits */
    perUser: RateLimitConfig;
    /** Per-repository rate limits */
    perRepo: RateLimitConfig;
  };
  /** Alerting configuration */
  alerting: AlertConfig;
  /** Logging configuration */
  logging: LogConfig;
}

/**
 * Parameters for creating a security alert
 */
export interface SecurityAlertParams {
  /** GitHub API client (from actions/github-script) */
  github: any;
  /** GitHub Actions context */
  context: any;
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
 * Security report statistics
 */
export interface SecurityReportStats {
  /** Total injection attempts in period */
  totalAttempts: number;
  /** Number of unique users */
  uniqueUsers: number;
  /** Number of users blocked */
  blockedUsers: number;
  /** Number of false positives identified */
  falsePositives: number;
  /** Pattern breakdown */
  patternBreakdown: {
    pattern: InjectionPattern;
    count: number;
    percentage: number;
  }[];
  /** User activity */
  userActivity: {
    user: string;
    attempts: number;
    status: 'active' | 'warned' | 'blocked' | 'cleared';
  }[];
  /** Time range of report */
  timeRange: {
    start: string;
    end: string;
  };
}
