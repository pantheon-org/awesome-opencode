/**
 * Domain module - Core domain logic for awesome-opencode
 *
 * This module exports all domain-related functionality including:
 * - Categories: Category management and operations
 * - Themes: Theme discovery, management, and analysis
 * - Tools: Tool management and tooling utilities
 * - Tags: Tag validation, extraction, and statistics
 */

export * from './categories';
export {
  // Re-export theme functionality except getAllTools (which conflicts with tools)
  getSuggestedTags,
  generateAllThemePages,
  discoverThemes,
  getActiveThemes,
  updateExistingThemeCounts,
  formatThemesForPrompt,
} from './themes';
// Re-export theme types
export type {
  Theme,
  ThemeStatus,
  ThemesConfig,
  ThemeCandidate,
  ThemeDiscoveryConfig,
} from './themes';
export * from './tools';
export * from './tags';
export type * from './types';
