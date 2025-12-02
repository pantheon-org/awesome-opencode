/**
 * Tests for Security History Analysis
 *
 * Covers:
 * - analyzeSecurityHistory function
 * - Trend calculation
 * - Pattern analysis
 * - Recommendation generation
 * - Report formatting
 */

import { describe, test, expect } from 'bun:test';
import { analyzeSecurityHistory } from './analyze-security-history';

describe('Security History Analysis', () => {
  describe('analyzeSecurityHistory', () => {
    test('should return valid analysis results', () => {
      const results = analyzeSecurityHistory(7);

      expect(results).toBeDefined();
      expect(results).toHaveProperty('timeRange');
      expect(results).toHaveProperty('summary');
      expect(results).toHaveProperty('trends');
      expect(results).toHaveProperty('patterns');
      expect(results).toHaveProperty('users');
      expect(results).toHaveProperty('recommendations');
    });

    test('should have valid time range', () => {
      const results = analyzeSecurityHistory(7);

      expect(results.timeRange).toHaveProperty('start');
      expect(results.timeRange).toHaveProperty('end');
      expect(results.timeRange).toHaveProperty('days');
      expect(results.timeRange.days).toBe(7);
    });

    test('should have valid summary statistics', () => {
      const results = analyzeSecurityHistory(7);

      expect(results.summary).toHaveProperty('totalAttempts');
      expect(results.summary).toHaveProperty('blockedAttempts');
      expect(results.summary).toHaveProperty('blockRate');
      expect(results.summary).toHaveProperty('uniqueUsers');
      expect(results.summary).toHaveProperty('blockedUsers');
      expect(results.summary).toHaveProperty('avgPerDay');

      // Verify numeric values
      expect(typeof results.summary.totalAttempts).toBe('number');
      expect(typeof results.summary.blockedAttempts).toBe('number');
      expect(typeof results.summary.blockRate).toBe('number');
      expect(results.summary.totalAttempts).toBeGreaterThanOrEqual(0);
      expect(results.summary.blockedAttempts).toBeGreaterThanOrEqual(0);
      expect(results.summary.blockRate).toBeGreaterThanOrEqual(0);
      expect(results.summary.blockRate).toBeLessThanOrEqual(100);
    });

    test('should have valid trend analysis', () => {
      const results = analyzeSecurityHistory(7);

      expect(results.trends).toHaveProperty('weeklyAverage');
      expect(results.trends).toHaveProperty('monthlyAverage');
      expect(results.trends).toHaveProperty('trend');
      expect(results.trends).toHaveProperty('changePercent');

      const validTrends = ['increasing', 'decreasing', 'stable'];
      expect(validTrends).toContain(results.trends.trend);
    });

    test('should have valid pattern breakdown', () => {
      const results = analyzeSecurityHistory(7);

      expect(results.patterns).toHaveProperty('mostCommon');
      expect(results.patterns).toHaveProperty('leastCommon');
      expect(results.patterns).toHaveProperty('breakdown');
      expect(Array.isArray(results.patterns.breakdown)).toBe(true);
    });

    test('should have valid user data', () => {
      const results = analyzeSecurityHistory(7);

      expect(results.users).toHaveProperty('topOffenders');
      expect(results.users).toHaveProperty('repeatOffenders');
      expect(Array.isArray(results.users.topOffenders)).toBe(true);
    });

    test('should have recommendations', () => {
      const results = analyzeSecurityHistory(7);

      expect(Array.isArray(results.recommendations)).toBe(true);
      expect(results.recommendations.length).toBeGreaterThan(0);
    });

    test('should handle different time ranges', () => {
      for (const days of [7, 30, 90]) {
        const results = analyzeSecurityHistory(days);
        expect(results.timeRange.days).toBe(days);
      }
    });

    test('should have blocked attempts less than or equal to total', () => {
      const results = analyzeSecurityHistory(7);

      expect(results.summary.blockedAttempts).toBeLessThanOrEqual(results.summary.totalAttempts);
    });

    test('should have consistency in block rate calculation', () => {
      const results = analyzeSecurityHistory(7);

      if (results.summary.totalAttempts > 0) {
        const expectedRate =
          (results.summary.blockedAttempts / results.summary.totalAttempts) * 100;
        expect(Math.abs(results.summary.blockRate - expectedRate)).toBeLessThan(0.1);
      }
    });
  });

  describe('Pattern Breakdown', () => {
    test('should have valid pattern entries', () => {
      const results = analyzeSecurityHistory(7);

      for (const pattern of results.patterns.breakdown) {
        expect(pattern).toHaveProperty('pattern');
        expect(pattern).toHaveProperty('count');
        expect(pattern).toHaveProperty('percentage');
        expect(typeof pattern.count).toBe('number');
        expect(typeof pattern.percentage).toBe('number');
      }
    });
  });

  describe('User Activity', () => {
    test('should have valid user entries', () => {
      const results = analyzeSecurityHistory(7);

      for (const user of results.users.topOffenders) {
        expect(user).toHaveProperty('user');
        expect(user).toHaveProperty('attempts');
        expect(user).toHaveProperty('status');
        expect(typeof user.user).toBe('string');
        expect(typeof user.attempts).toBe('number');
      }
    });
  });
});
