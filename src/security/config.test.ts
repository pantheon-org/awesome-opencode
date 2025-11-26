/**
 * Tests for security configuration module
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadSecurityConfig, getConfigPath, hasSecurityConfig } from './config';

const TEST_CONFIG_DIR = join(process.cwd(), 'config');
const TEST_CONFIG_PATH = join(TEST_CONFIG_DIR, 'security.json');

describe('Security Config Module', () => {
  beforeEach(() => {
    // Ensure config directory exists
    if (!existsSync(TEST_CONFIG_DIR)) {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test config file if it exists
    if (existsSync(TEST_CONFIG_PATH)) {
      rmSync(TEST_CONFIG_PATH, { force: true });
    }
  });

  describe('getConfigPath', () => {
    test('returns correct config path', () => {
      const path = getConfigPath();
      expect(path).toContain('config');
      expect(path).toContain('security.json');
    });
  });

  describe('hasSecurityConfig', () => {
    test('returns false when config does not exist', () => {
      if (existsSync(TEST_CONFIG_PATH)) {
        rmSync(TEST_CONFIG_PATH);
      }
      expect(hasSecurityConfig()).toBe(false);
    });

    test('returns true when config exists', () => {
      writeFileSync(TEST_CONFIG_PATH, JSON.stringify({}));
      expect(hasSecurityConfig()).toBe(true);
    });
  });

  describe('loadSecurityConfig', () => {
    test('loads valid config from file', () => {
      const testConfig = {
        rateLimits: {
          perUser: { maxAttempts: 10, windowMinutes: 120 },
          perRepo: { maxAttempts: 30, windowMinutes: 2880 },
        },
        alerting: {
          enabled: true,
          createIssue: true,
          commentOnSource: false,
          webhookUrl: 'https://example.com/webhook',
        },
        logging: {
          enabled: true,
          retentionDays: 60,
        },
      };

      writeFileSync(TEST_CONFIG_PATH, JSON.stringify(testConfig));

      const config = loadSecurityConfig();

      expect(config.rateLimits.perUser.maxAttempts).toBe(10);
      expect(config.rateLimits.perUser.windowMinutes).toBe(120);
      expect(config.alerting.webhookUrl).toBe('https://example.com/webhook');
      expect(config.logging.retentionDays).toBe(60);
    });

    test('returns default config when file does not exist', () => {
      if (existsSync(TEST_CONFIG_PATH)) {
        rmSync(TEST_CONFIG_PATH);
      }

      const config = loadSecurityConfig();

      expect(config.rateLimits.perUser.maxAttempts).toBe(5);
      expect(config.rateLimits.perUser.windowMinutes).toBe(60);
      expect(config.rateLimits.perRepo.maxAttempts).toBe(20);
      expect(config.rateLimits.perRepo.windowMinutes).toBe(1440);
      expect(config.alerting.enabled).toBe(true);
      expect(config.logging.retentionDays).toBe(30);
    });

    test('returns default config when file is invalid JSON', () => {
      writeFileSync(TEST_CONFIG_PATH, 'invalid json{');

      const config = loadSecurityConfig();

      expect(config.rateLimits.perUser.maxAttempts).toBe(5);
      expect(config.logging.enabled).toBe(true);
    });

    test('returns default config when file is missing required fields', () => {
      writeFileSync(TEST_CONFIG_PATH, JSON.stringify({ rateLimits: {} }));

      const config = loadSecurityConfig();

      expect(config.rateLimits.perUser.maxAttempts).toBe(5);
      expect(config.alerting).toBeDefined();
      expect(config.logging).toBeDefined();
    });
  });
});
