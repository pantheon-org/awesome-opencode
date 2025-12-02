/**
 * Shared domain types - Central location for all domain-related type definitions
 *
 * This file re-exports all types from domain submodules for convenience.
 * Import shared types from this file when possible.
 */

// Category types
export type { Category, CategoriesConfig } from './categories/types';
export { CategorySchema, CategoriesConfigSchema } from './categories/types';

// Theme types
export type {
  Theme,
  ThemeStatus,
  ThemesConfig,
  ThemeCandidate,
  ThemeDiscoveryConfig,
} from './themes/types';
export {
  ThemeSchema,
  ThemeStatusSchema,
  ThemesConfigSchema,
  ThemeCandidateSchema,
  ThemeDiscoveryConfigSchema,
} from './themes/types';

// Tool types
export type { ToolInfo, ToolMetadata, ToolThemes, ToolFrontmatter } from './tools/types';
export {
  ToolInfoSchema,
  ToolMetadataSchema,
  ToolThemesSchema,
  ToolFrontmatterSchema,
} from './tools/types';

// Tag types
export type { TagValidationResult } from './tags/types';
export { TagValidationResultSchema } from './tags/types';
