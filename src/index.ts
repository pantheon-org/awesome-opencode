/**
 * Main entry point for awesome-opencode utilities
 *
 * Re-exports all public APIs from the domain, security, validation, reporting,
 * monitoring, and I/O modules for external consumption.
 */

// Domain module exports (categories, themes, tools, tags)
export * from './domain';

// Security module exports (sanitization, rate limiting, tracking, alerting)
export * from './security';

// Validation module exports (schema validation, data validation)
export {
  validateCategories,
  validateCategoriesFile,
  validateThemes,
  validateThemesFile,
} from './validation';

// Reporting module exports (analysis and reporting utilities)
export { analyzeThemes, generateRecommendations } from './reporting/theme-analysis';
export {
  analyzeSecurityHistory,
  generateSecurityDashboard,
  generateSecurityReport,
} from './reporting/security-analysis';

// Monitoring module exports (logging and metrics)
export { SecurityLogger, logger, LogLevel } from './monitoring/logger';
export {
  collectSecurityMetrics,
  collectLogStatistics,
  getTopUsersByAttempts,
} from './monitoring/metrics';

// I/O module exports (file operations, markdown parsing, JSON handling)
export * from './io';

// Type exports
export type * from './domain/types';
export type * from './security/types';
export type { LogEntry, LogCategory } from './monitoring/logger';
export type { SecurityMetrics, LogStatistics, TimeRange } from './monitoring/metrics';
export type {
  CategoriesValidationResult,
  CategoriesData,
  ThemesValidationResult,
  ThemeMetadata,
  ThemesData,
} from './validation';
export type {
  ThemeAnalysisReport,
  ThemeStatistics,
  SecurityAnalysisResult,
  PatternBreakdownEntry,
  UserActivityEntry,
  SecurityDashboardData,
  SecurityReport,
} from './reporting';
