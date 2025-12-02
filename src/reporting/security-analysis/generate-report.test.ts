/**
 * Tests for Security Report Generation
 *
 * Covers:
 * - generateSecurityReport function
 * - Report content generation
 * - Statistics formatting
 * - Recommendations
 */

import { describe, test, expect } from 'bun:test';
import { generateSecurityReport } from './generate-report';

describe('Security Report Generation', () => {
  describe('generateSecurityReport', () => {
    test('should generate valid report markdown', () => {
      const report = generateSecurityReport(7);

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });

    test('should include report title', () => {
      const report = generateSecurityReport(7);

      expect(report).toContain('# Security Report');
    });

    test('should include summary section', () => {
      const report = generateSecurityReport(7);

      expect(report).toContain('## Summary');
      expect(report).toContain('Total injection attempts');
      expect(report).toContain('Unique users');
    });

    test('should include report period', () => {
      const report = generateSecurityReport(7);

      expect(report).toContain('Report Period');
    });

    test('should handle different time ranges', () => {
      for (const days of [7, 30, 90]) {
        const report = generateSecurityReport(days);

        expect(report).toContain('# Security Report');
        expect(typeof report).toBe('string');
        expect(report.length).toBeGreaterThan(0);
      }
    });

    test('should be valid markdown', () => {
      const report = generateSecurityReport(7);

      // Check for markdown formatting elements
      expect(report).toContain('#');
      expect(report).toContain('**');
    });

    test('should include statistics', () => {
      const report = generateSecurityReport(7);

      expect(report).toContain('injection attempts');
      expect(report).toContain('users');
    });
  });

  describe('Report Format', () => {
    test('should have consistent structure', () => {
      const report = generateSecurityReport(7);

      // Check required sections
      expect(report).toContain('## Summary');
      expect(report).toContain('---');
    });
  });
});
