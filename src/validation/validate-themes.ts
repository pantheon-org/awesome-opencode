/**
 * Validation module for themes.json
 * Validates themes data against JSON schema and checks for injection attempts
 */

import Ajv, { type ErrorObject } from 'ajv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { detectInjectionAttempt } from '../security';

/**
 * Validation result for themes
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Theme metadata structure
 */
export interface ThemeMetadata {
  auto_discovered: boolean;
  tool_count: number;
  created_date: string;
  approved_by?: string;
  confidence?: number;
}

/**
 * Theme structure
 */
export interface Theme {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  categories: string[];
  status: 'active' | 'under_review' | 'inactive';
  metadata: ThemeMetadata;
}

/**
 * Themes data structure
 */
export interface ThemesData {
  themes: Theme[];
  suggested_tags?: string[];
  seed_themes?: string[];
}

// Initialize Ajv (disable validateSchema to avoid meta-schema errors)
const ajv = new Ajv({ allErrors: true, validateSchema: false });

// Load and compile schema
const schemaPath = join(process.cwd(), 'schemas', 'themes.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
const validate = ajv.compile(schema);

/**
 * Format AJV error for human readability
 */
function formatAjvError(error: ErrorObject): string {
  const path = error.instancePath || '/';
  const message = error.message || 'validation failed';
  const params = error.params ? ` (${JSON.stringify(error.params)})` : '';
  return `${path}: ${message}${params}`;
}

/**
 * Validate a single theme for injection attempts
 */
function validateThemeInjection(theme: Theme, errors: string[]): void {
  if (detectInjectionAttempt(theme.id)) {
    errors.push(`Theme "${theme.id}": ID contains potential injection pattern`);
  }
  if (detectInjectionAttempt(theme.name)) {
    errors.push(`Theme "${theme.id}": Name contains potential injection pattern`);
  }
  if (detectInjectionAttempt(theme.description)) {
    errors.push(`Theme "${theme.id}": Description contains potential injection pattern`);
  }
  if (theme.keywords) {
    for (const keyword of theme.keywords) {
      if (detectInjectionAttempt(keyword)) {
        errors.push(
          `Theme "${theme.id}": Keyword "${keyword}" contains potential injection pattern`,
        );
      }
    }
  }
  if (theme.categories) {
    for (const category of theme.categories) {
      if (detectInjectionAttempt(category)) {
        errors.push(
          `Theme "${theme.id}": Category "${category}" contains potential injection pattern`,
        );
      }
    }
  }
}

/**
 * Validate themes metadata for injection attempts
 */
function validateThemesMetadata(themesData: ThemesData, errors: string[]): void {
  const suggestedTags = themesData.suggested_tags || [];
  for (const tag of suggestedTags) {
    if (detectInjectionAttempt(tag)) {
      errors.push(`Suggested tag "${tag}" contains potential injection pattern`);
    }
  }

  const seedThemes = themesData.seed_themes || [];
  for (const seedTheme of seedThemes) {
    if (detectInjectionAttempt(seedTheme)) {
      errors.push(`Seed theme "${seedTheme}" contains potential injection pattern`);
    }
  }
}

/**
 * Validate themes data
 *
 * @param data - Themes data to validate
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const data = JSON.parse(fs.readFileSync('themes.json', 'utf-8'));
 * const result = validateThemes(data);
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export function validateThemes(data: unknown): ValidationResult {
  const errors: string[] = [];

  // Step 1: Schema validation
  const valid = validate(data);
  if (!valid && validate.errors) {
    errors.push(...validate.errors.map(formatAjvError));
  }

  // Step 2: Injection pattern detection
  if (typeof data === 'object' && data !== null) {
    const themesData = data as ThemesData;
    const themes = themesData.themes || [];

    for (const theme of themes) {
      validateThemeInjection(theme, errors);
    }

    validateThemesMetadata(themesData, errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate themes from file path
 *
 * @param filePath - Path to themes JSON file
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateThemesFile('./data/themes.json');
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export function validateThemesFile(filePath: string): ValidationResult {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return validateThemes(data);
  } catch (error) {
    return {
      valid: false,
      errors: [
        `Failed to read or parse file: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}
