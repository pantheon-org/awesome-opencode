/**
 * Rate limiting module for injection attempt tracking
 *
 * Prevents abuse by limiting the number of injection attempts
 * allowed per user and per repository within time windows.
 *
 * Features:
 * - Per-user rate limits (e.g., 5 attempts per hour)
 * - Per-repository rate limits (e.g., 20 attempts per day)
 * - File-based state persistence
 * - Automatic window reset
 * - Thread-safe operations
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { RateLimitState, RateLimitEntry, RateLimitResult, RateLimitConfig } from './types';
import { loadSecurityConfig } from './config';

/**
 * Get path to rate limit state file for a specific scope
 *
 * @param scope - Scope of rate limiting ('user' or 'repo')
 * @returns Absolute path to state file
 */
export function getRateLimitStatePath(scope: 'user' | 'repo'): string {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  return join(dataDir, `${scope}.rate-limit.json`);
}

/**
 * Load rate limit state from file
 *
 * @param scope - Scope of rate limiting
 * @returns Rate limit state object
 */
export function loadRateLimitState(scope: 'user' | 'repo'): RateLimitState {
  const statePath = getRateLimitStatePath(scope);

  if (!existsSync(statePath)) {
    return {};
  }

  try {
    const content = readFileSync(statePath, 'utf-8');
    return JSON.parse(content) as RateLimitState;
  } catch (error) {
    console.error(`Failed to load rate limit state for ${scope}:`, error);
    return {};
  }
}

/**
 * Save rate limit state to file
 *
 * @param scope - Scope of rate limiting
 * @param state - Rate limit state to save
 */
export function saveRateLimitState(scope: 'user' | 'repo', state: RateLimitState): void {
  const statePath = getRateLimitStatePath(scope);

  try {
    const content = JSON.stringify(state, null, 2);
    writeFileSync(statePath, content, { encoding: 'utf-8' });
  } catch (error) {
    console.error(`Failed to save rate limit state for ${scope}:`, error);
  }
}

/**
 * Check if a request is within rate limits
 *
 * @param entityId - User or repository identifier
 * @param scope - Scope of rate limiting ('user' or 'repo')
 * @param config - Optional rate limit configuration (uses default from config if not provided)
 * @returns Rate limit result with allowed status and remaining attempts
 *
 * @example
 * ```typescript
 * const result = checkRateLimit('username', 'user');
 * if (!result.allowed) {
 *   console.log(`Rate limit exceeded. Resets at: ${result.resetAt}`);
 * } else {
 *   console.log(`Request allowed. ${result.remaining} attempts remaining`);
 * }
 * ```
 */
export function checkRateLimit(
  entityId: string,
  scope: 'user' | 'repo',
  config?: RateLimitConfig,
): RateLimitResult {
  const securityConfig = loadSecurityConfig();
  const rateLimitConfig =
    config ??
    (scope === 'user' ? securityConfig.rateLimits.perUser : securityConfig.rateLimits.perRepo);

  const state = loadRateLimitState(scope);
  const now = Date.now();
  const windowMs = rateLimitConfig.windowMinutes * 60 * 1000;

  // Get or initialize entry for this entity
  let entry = state[entityId];
  if (!entry) {
    entry = {
      attempts: 0,
      firstAttempt: now,
      lastAttempt: now,
    };
    state[entityId] = entry;
  }

  // Check if window has expired and should be reset
  const windowAge = now - entry.firstAttempt;
  if (windowAge > windowMs) {
    // Reset window
    entry.attempts = 0;
    entry.firstAttempt = now;
    entry.lastAttempt = now;
  }

  // Calculate reset timestamp
  const resetAt = new Date(entry.firstAttempt + windowMs).toISOString();

  // Check if limit exceeded
  const allowed = entry.attempts < rateLimitConfig.maxAttempts;
  const remaining = Math.max(0, rateLimitConfig.maxAttempts - entry.attempts);
  const blocked = entry.attempts >= rateLimitConfig.maxAttempts;

  // Increment attempt counter if allowed
  if (allowed) {
    entry.attempts++;
    entry.lastAttempt = now;
    saveRateLimitState(scope, state);
  }

  return {
    allowed,
    remaining,
    resetAt,
    blocked,
  };
}

/**
 * Record an injection attempt for rate limiting purposes
 * This increments the counter WITHOUT checking if it's allowed
 * Use this after detecting an injection to track it
 *
 * @param entityId - User or repository identifier
 * @param scope - Scope of rate limiting
 */
export function recordInjectionAttempt(entityId: string, scope: 'user' | 'repo'): void {
  const state = loadRateLimitState(scope);
  const now = Date.now();

  let entry = state[entityId];
  if (!entry) {
    entry = {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
    };
  } else {
    entry.attempts++;
    entry.lastAttempt = now;
  }

  state[entityId] = entry;
  saveRateLimitState(scope, state);
}

/**
 * Reset rate limit for a specific entity
 * Useful for clearing false positives or after manual review
 *
 * @param entityId - User or repository identifier
 * @param scope - Scope of rate limiting
 *
 * @example
 * ```typescript
 * // Reset rate limit for a user after false positive
 * resetRateLimit('username', 'user');
 * ```
 */
export function resetRateLimit(entityId: string, scope: 'user' | 'repo'): void {
  const state = loadRateLimitState(scope);

  if (state[entityId]) {
    delete state[entityId];
    saveRateLimitState(scope, state);
  }
}

/**
 * Get current rate limit status for an entity WITHOUT incrementing counter
 *
 * @param entityId - User or repository identifier
 * @param scope - Scope of rate limiting
 * @returns Current rate limit information
 *
 * @example
 * ```typescript
 * const status = getRateLimitStatus('username', 'user');
 * console.log(`User has made ${status.attempts} attempts`);
 * ```
 */
export function getRateLimitStatus(
  entityId: string,
  scope: 'user' | 'repo',
): RateLimitEntry | null {
  const state = loadRateLimitState(scope);
  return state[entityId] ?? null;
}

/**
 * Get all entities currently tracked in rate limit state
 *
 * @param scope - Scope of rate limiting
 * @returns Array of entity IDs
 */
export function getTrackedEntities(scope: 'user' | 'repo'): string[] {
  const state = loadRateLimitState(scope);
  return Object.keys(state);
}

/**
 * Clean up expired entries from rate limit state
 * Removes entries where the window has expired
 *
 * @param scope - Scope of rate limiting
 * @returns Number of entries removed
 */
export function cleanupExpiredEntries(scope: 'user' | 'repo'): number {
  const securityConfig = loadSecurityConfig();
  const rateLimitConfig =
    scope === 'user' ? securityConfig.rateLimits.perUser : securityConfig.rateLimits.perRepo;

  const state = loadRateLimitState(scope);
  const now = Date.now();
  const windowMs = rateLimitConfig.windowMinutes * 60 * 1000;

  let removedCount = 0;

  for (const [entityId, entry] of Object.entries(state)) {
    const windowAge = now - entry.firstAttempt;
    if (windowAge > windowMs) {
      delete state[entityId];
      removedCount++;
    }
  }

  if (removedCount > 0) {
    saveRateLimitState(scope, state);
  }

  return removedCount;
}

/**
 * Check if an entity is currently blocked due to rate limiting
 *
 * @param entityId - User or repository identifier
 * @param scope - Scope of rate limiting
 * @returns True if entity is blocked
 */
export function isBlocked(entityId: string, scope: 'user' | 'repo'): boolean {
  const securityConfig = loadSecurityConfig();
  const rateLimitConfig =
    scope === 'user' ? securityConfig.rateLimits.perUser : securityConfig.rateLimits.perRepo;

  const state = loadRateLimitState(scope);
  const entry = state[entityId];

  if (!entry) {
    return false;
  }

  const now = Date.now();
  const windowMs = rateLimitConfig.windowMinutes * 60 * 1000;
  const windowAge = now - entry.firstAttempt;

  // If window expired, not blocked
  if (windowAge > windowMs) {
    return false;
  }

  // Check if attempts exceed limit
  return entry.attempts >= rateLimitConfig.maxAttempts;
}
