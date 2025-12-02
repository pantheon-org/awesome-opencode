/**
 * Tests for Security Dashboard Generation
 *
 * Covers:
 * - generateSecurityDashboard function
 * - Dashboard content generation
 * - Metrics formatting
 * - Chart generation
 */

import { describe, test, expect } from 'bun:test';
import { generateSecurityDashboard } from './generate-dashboard';
import type { SecurityMetrics } from '../../monitoring/metrics';

describe('Security Dashboard Generation', () => {
  describe('generateSecurityDashboard', () => {
    test('should generate valid dashboard markdown', () => {
      const mockMetrics: SecurityMetrics = {
        totalAttempts: 10,
        blockedAttempts: 8,
        uniqueUsers: 5,
        blockedUsers: 2,
        avgAttemptsPerDay: 1.4,
        mostCommonPattern: 'role-switching',
        mostTargetedWorkflow: 'triage',
        patternBreakdown: {
          'role-switching': 5,
          'instruction-override': 3,
          'delimiter-injection': 2,
          'context-confusion': 0,
          'encoded-payload': 0,
          'url-injection': 0,
          unknown: 0,
        },
        workflowBreakdown: {
          triage: 6,
          categorize: 4,
          validate: 0,
        },
        timeSeriesData: [
          { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), attempts: 1 },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), attempts: 2 },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), attempts: 1 },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), attempts: 2 },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), attempts: 2 },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), attempts: 1 },
          { date: new Date().toISOString(), attempts: 1 },
        ],
      };

      const dashboard = generateSecurityDashboard(mockMetrics, 30);

      expect(dashboard).toBeDefined();
      expect(typeof dashboard).toBe('string');
      expect(dashboard.length).toBeGreaterThan(0);
    });

    test('should include dashboard title', () => {
      const mockMetrics: SecurityMetrics = {
        totalAttempts: 0,
        blockedAttempts: 0,
        uniqueUsers: 0,
        blockedUsers: 0,
        avgAttemptsPerDay: 0,
        mostCommonPattern: null,
        mostTargetedWorkflow: null,
        patternBreakdown: {
          'role-switching': 0,
          'instruction-override': 0,
          'delimiter-injection': 0,
          'context-confusion': 0,
          'encoded-payload': 0,
          'url-injection': 0,
          unknown: 0,
        },
        workflowBreakdown: {
          triage: 0,
          categorize: 0,
          validate: 0,
        },
        timeSeriesData: [],
      };

      const dashboard = generateSecurityDashboard(mockMetrics, 30);

      expect(dashboard).toContain('# Security Monitoring Dashboard');
    });

    test('should include metrics overview', () => {
      const mockMetrics: SecurityMetrics = {
        totalAttempts: 5,
        blockedAttempts: 4,
        uniqueUsers: 3,
        blockedUsers: 1,
        avgAttemptsPerDay: 0.5,
        mostCommonPattern: 'role-switching',
        mostTargetedWorkflow: 'categorize',
        patternBreakdown: {
          'role-switching': 5,
          'instruction-override': 0,
          'delimiter-injection': 0,
          'context-confusion': 0,
          'encoded-payload': 0,
          'url-injection': 0,
          unknown: 0,
        },
        workflowBreakdown: {
          triage: 0,
          categorize: 5,
          validate: 0,
        },
        timeSeriesData: [],
      };

      const dashboard = generateSecurityDashboard(mockMetrics, 30);

      expect(dashboard).toContain('## Overview');
      expect(dashboard).toContain('Total Injection Attempts');
      expect(dashboard).toContain('Unique Users');
    });

    test('should include recommendations section', () => {
      const mockMetrics: SecurityMetrics = {
        totalAttempts: 0,
        blockedAttempts: 0,
        uniqueUsers: 0,
        blockedUsers: 0,
        avgAttemptsPerDay: 0,
        mostCommonPattern: null,
        mostTargetedWorkflow: null,
        patternBreakdown: {
          'role-switching': 0,
          'instruction-override': 0,
          'delimiter-injection': 0,
          'context-confusion': 0,
          'encoded-payload': 0,
          'url-injection': 0,
          unknown: 0,
        },
        workflowBreakdown: {
          triage: 0,
          categorize: 0,
          validate: 0,
        },
        timeSeriesData: [],
      };

      const dashboard = generateSecurityDashboard(mockMetrics, 30);

      expect(dashboard).toContain('## Recommendations');
    });

    test('should handle zero metrics gracefully', () => {
      const mockMetrics: SecurityMetrics = {
        totalAttempts: 0,
        blockedAttempts: 0,
        uniqueUsers: 0,
        blockedUsers: 0,
        avgAttemptsPerDay: 0,
        mostCommonPattern: null,
        mostTargetedWorkflow: null,
        patternBreakdown: {
          'role-switching': 0,
          'instruction-override': 0,
          'delimiter-injection': 0,
          'context-confusion': 0,
          'encoded-payload': 0,
          'url-injection': 0,
          unknown: 0,
        },
        workflowBreakdown: {
          triage: 0,
          categorize: 0,
          validate: 0,
        },
        timeSeriesData: [],
      };

      expect(() => {
        generateSecurityDashboard(mockMetrics, 30);
      }).not.toThrow();
    });
  });

  describe('Dashboard Content', () => {
    test('should be valid markdown', () => {
      const mockMetrics: SecurityMetrics = {
        totalAttempts: 0,
        blockedAttempts: 0,
        uniqueUsers: 0,
        blockedUsers: 0,
        avgAttemptsPerDay: 0,
        mostCommonPattern: null,
        mostTargetedWorkflow: null,
        patternBreakdown: {
          'role-switching': 0,
          'instruction-override': 0,
          'delimiter-injection': 0,
          'context-confusion': 0,
          'encoded-payload': 0,
          'url-injection': 0,
          unknown: 0,
        },
        workflowBreakdown: {
          triage: 0,
          categorize: 0,
          validate: 0,
        },
        timeSeriesData: [],
      };

      const dashboard = generateSecurityDashboard(mockMetrics, 30);

      // Check for markdown formatting elements
      expect(dashboard).toContain('#');
      expect(dashboard).toContain('|');
      expect(dashboard).toContain('---');
    });
  });
});
