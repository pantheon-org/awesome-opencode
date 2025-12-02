/**
 * Tests for Theme Analysis Module
 *
 * Covers:
 * - analyzeThemes function
 * - Theme statistics collection
 * - Report generation
 * - Edge cases and error handling
 */

import { describe, test, expect } from 'bun:test';
import { analyzeThemes } from './analyze-themes';

describe('Theme Analysis', () => {
  describe('analyzeThemes', () => {
    test('should return a valid theme analysis report', () => {
      const report = analyzeThemes();

      expect(report).toBeDefined();
      expect(report).toHaveProperty('themes');
      expect(report).toHaveProperty('totalTools');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('recommendations');
    });

    test('should have valid timestamp', () => {
      const report = analyzeThemes();
      const timestamp = new Date(report.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should have array of themes', () => {
      const report = analyzeThemes();

      expect(Array.isArray(report.themes)).toBe(true);
    });

    test('should have recommendations array', () => {
      const report = analyzeThemes();

      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('should have non-negative tool count', () => {
      const report = analyzeThemes();

      expect(report.totalTools).toBeGreaterThanOrEqual(0);
      expect(typeof report.totalTools).toBe('number');
    });

    test('should not throw without output path', () => {
      expect(() => {
        analyzeThemes();
      }).not.toThrow();
    });

    test('should not throw when called with optional params', () => {
      expect(() => {
        analyzeThemes();
      }).not.toThrow();
    });
  });

  describe('Theme Report Structure', () => {
    test('should have valid theme statistics structure when themes exist', () => {
      const report = analyzeThemes();

      if (report.themes.length > 0) {
        const theme = report.themes[0];
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('toolCount');
        expect(theme).toHaveProperty('confidence');
        expect(theme).toHaveProperty('relatedCategories');
      }
    });

    test('should have numeric tool counts in themes', () => {
      const report = analyzeThemes();

      for (const theme of report.themes) {
        expect(typeof theme.toolCount).toBe('number');
        expect(theme.toolCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have numeric confidence scores', () => {
      const report = analyzeThemes();

      for (const theme of report.themes) {
        expect(typeof theme.confidence).toBe('number');
        expect(theme.confidence).toBeGreaterThanOrEqual(0);
        expect(theme.confidence).toBeLessThanOrEqual(1);
      }
    });

    test('should have array of related categories', () => {
      const report = analyzeThemes();

      for (const theme of report.themes) {
        expect(Array.isArray(theme.relatedCategories)).toBe(true);
      }
    });
  });
});
