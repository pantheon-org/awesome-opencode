import { join } from 'node:path';
import { CategoriesConfig, Category } from './types';
import { readFileSync, existsSync } from 'node:fs';
import { validateCategories } from '../validation';

/**
 * Load categories from data/categories.json
 *
 * Validates the data against JSON schema and checks for injection patterns
 * before returning the categories.
 *
 * @throws {Error} If file not found or validation fails
 */
export const loadCategories = (): Category[] => {
  const configPath = join(process.cwd(), 'data', 'categories.json');

  if (!existsSync(configPath)) {
    throw new Error('data/categories.json not found in project root');
  }

  const content = readFileSync(configPath, 'utf-8');
  const config: CategoriesConfig = JSON.parse(content);

  // Validate data structure and security
  const validation = validateCategories(config);
  if (!validation.valid) {
    throw new Error(
      `Categories validation failed:\n${validation.errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }

  return config.categories;
};
