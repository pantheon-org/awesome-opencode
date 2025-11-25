/**
 * Validation module for categories.json
 * Validates categories data against JSON schema and checks for injection attempts
 */

import Ajv, { type ErrorObject } from 'ajv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { detectInjectionAttempt } from '../security';

/**
 * Validation result for categories
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Category structure
 */
export interface Category {
  slug: string;
  title: string;
  description: string;
}

/**
 * Categories data structure
 */
export interface CategoriesData {
  categories: Category[];
}

// Initialize Ajv (disable validateSchema to avoid meta-schema errors)
const ajv = new Ajv({ allErrors: true, validateSchema: false });

// Load and compile schema
const schemaPath = join(process.cwd(), 'schemas', 'categories.schema.json');
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
 * Validate categories data against schema and security rules
 *
 * @param data - Data to validate (should be CategoriesData structure)
 * @returns Validation result with boolean status and error messages
 *
 * @example
 * ```typescript
 * const data = JSON.parse(readFileSync('data/categories.json', 'utf-8'));
 * const result = validateCategories(data);
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export function validateCategories(data: unknown): ValidationResult {
  const errors: string[] = [];

  // Step 1: Schema validation
  const valid = validate(data);
  if (!valid && validate.errors) {
    errors.push(...validate.errors.map(formatAjvError));
  }

  // Step 2: Injection pattern detection
  if (typeof data === 'object' && data !== null) {
    const categoriesData = data as CategoriesData;
    const categories = categoriesData.categories || [];

    for (const category of categories) {
      // Check slug for injection attempts
      if (detectInjectionAttempt(category.slug)) {
        errors.push(`Category "${category.slug}": Slug contains potential injection pattern`);
      }

      // Check title for injection attempts
      if (detectInjectionAttempt(category.title)) {
        errors.push(`Category "${category.slug}": Title contains potential injection pattern`);
      }

      // Check description for injection attempts
      if (detectInjectionAttempt(category.description)) {
        errors.push(
          `Category "${category.slug}": Description contains potential injection pattern`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate categories from file path
 *
 * @param filePath - Path to categories JSON file
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateCategoriesFile('./data/categories.json');
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export function validateCategoriesFile(filePath: string): ValidationResult {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return validateCategories(data);
  } catch (error) {
    return {
      valid: false,
      errors: [
        `Failed to read or parse file: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}
