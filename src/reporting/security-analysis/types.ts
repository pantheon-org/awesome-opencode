/**
 * Security Analysis Module Type Definitions
 *
 * Defines types for security analysis results, dashboards, and reports
 */

import type { InjectionPattern } from '../../security/types';

/**
 * Result of security history analysis
 */
export interface SecurityAnalysisResult {
  totalAlerts: number;
  injectionAttempts: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
}

/**
 * Pattern breakdown entry
 */
export interface PatternBreakdownEntry {
  pattern: InjectionPattern;
  count: number;
  percentage: number;
}

/**
 * User activity entry
 */
export interface UserActivityEntry {
  user: string;
  attempts: number;
  status: 'active' | 'warned' | 'blocked';
}

/**
 * Security dashboard data
 */
export interface SecurityDashboardData {
  timestamp: string;
  timeRange: {
    start: string;
    end: string;
    days: number;
  };
  summary: {
    totalAttempts: number;
    blockedAttempts: number;
    blockRate: number;
    uniqueUsers: number;
    blockedUsers: number;
    avgPerDay: number;
  };
  patterns: PatternBreakdownEntry[];
  topUsers: UserActivityEntry[];
}

/**
 * Security report content
 */
export interface SecurityReport {
  header: string;
  summary: string;
  patterns: string;
  userActivity: string;
  recommendations: string;
}
