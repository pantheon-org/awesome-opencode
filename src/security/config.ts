/**
 * Security configuration loader
 *
 * Loads and validates security configuration from config/security.json
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { SecurityConfig } from './types';

/**
 * Default security configuration
 * Used when config file is not found or invalid
 */
const DEFAULT_CONFIG: SecurityConfig = {
  rateLimits: {
    perUser: {
      maxAttempts: 5,
      windowMinutes: 60,
    },
    perRepo: {
      maxAttempts: 20,
      windowMinutes: 1440,
    },
  },
  alerting: {
    enabled: true,
    createIssue: true,
    commentOnSource: true,
    webhookUrl: null,
  },
  logging: {
    enabled: true,
    retentionDays: 30,
  },
};

/**
 * Get path to security configuration file
 * @returns Absolute path to config/security.json
 */
export const getConfigPath = (): string => {
  return join(process.cwd(), 'config', 'security.json');
};

/**
 * Load security configuration from file
 * Falls back to default configuration if file doesn't exist or is invalid
 *
 * @returns Security configuration object
 *
 * @example
 * ```typescript
 * const config = loadSecurityConfig();
 * console.log(config.rateLimits.perUser.maxAttempts); // 5
 * ```
 */
export const loadSecurityConfig = (): SecurityConfig => {
  const configPath = getConfigPath();

  // Use default config if file doesn't exist
  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as SecurityConfig;

    // Validate required fields
    if (!config.rateLimits || !config.alerting || !config.logging) {
      console.warn('Invalid security config, using defaults');
      return { ...DEFAULT_CONFIG };
    }

    return config;
  } catch (error) {
    console.error('Failed to load security config:', error);
    return { ...DEFAULT_CONFIG };
  }
};

/**
 * Check if security configuration file exists
 * @returns True if config file exists
 */
export const hasSecurityConfig = (): boolean => {
  return existsSync(getConfigPath());
};
