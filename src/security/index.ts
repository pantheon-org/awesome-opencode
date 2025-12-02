/**
 * Security module exports for prompt injection prevention,
 * rate limiting, tracking, and alerting
 */

// Input sanitization exports
export {
  sanitizeGitHubUrl,
  sanitizeRepoName,
  sanitizeFilePath,
  sanitizeTextContent,
  sanitizeJsonData,
  extractIssueNumber,
  detectInjectionAttempt,
} from './sanitize-ai-input';

// GitHub URL validation exports
export {
  sanitizeGitHubUrl as sanitizeGitHubUrlStrict,
  isValidGitHubUrl,
  extractRepoInfo,
  filterValidGitHubUrls,
  extractGitHubUrls,
  type GitHubUrlValidationResult,
} from './github-url';

// Prompt builder exports
export {
  SafePromptBuilder,
  buildSafeReplacements,
  safeTemplateReplace,
  createSafePrompt,
} from './safe-prompt-builder';

// Configuration exports
export { loadSecurityConfig, getConfigPath, hasSecurityConfig } from './config';

// Type exports
export type {
  WorkflowType,
  InjectionPattern,
  InjectionAttempt,
  RateLimitConfig,
  RateLimitEntry,
  RateLimitState,
  RateLimitResult,
  AlertConfig,
  LogConfig,
  SecurityConfig,
  SecurityAlertParams,
  SecurityReportStats,
} from './types';

// Tracking exports
export {
  trackInjectionAttempt,
  cleanupOldLogs,
  readInjectionAttempts,
  getInjectionAttemptsByUser,
  getUniqueUsersWithAttempts,
  countAttemptsByPattern,
  countAttemptsByWorkflow,
  generateContentHash,
  getSecurityLogsDir,
  ensureSecurityLogsDir,
  getLogFilePath,
} from './track-injections';

// Rate limiting exports
export {
  checkRateLimit,
  recordInjectionAttempt,
  resetRateLimit,
  getRateLimitStatus,
  getTrackedEntities,
  cleanupExpiredEntries,
  isBlocked,
  loadRateLimitState,
  saveRateLimitState,
  getRateLimitStatePath,
} from './rate-limit';

// Alerting exports
export {
  createSecurityAlert,
  postSecurityWarning,
  addSecurityLabels,
  blockIssue,
  sendWebhookAlert,
  handleSecurityIncident,
} from './alert';
