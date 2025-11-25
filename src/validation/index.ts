/**
 * Validation module exports for JSON schema validation
 *
 * This module provides validation functions for data files used in AI prompts.
 * All data files are validated against JSON schemas and checked for injection attempts
 * before being passed to AI agents.
 */

// Categories validation exports
export {
  validateCategories,
  validateCategoriesFile,
  type ValidationResult as CategoriesValidationResult,
  type Category,
  type CategoriesData,
} from './validate-categories';

// Themes validation exports
export {
  validateThemes,
  validateThemesFile,
  type ValidationResult as ThemesValidationResult,
  type Theme,
  type ThemeMetadata,
  type ThemesData,
} from './validate-themes';
