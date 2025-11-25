import { join } from 'node:path';
import { CategoriesConfig, Category } from './types';
import { readFileSync, existsSync } from 'node:fs';

/**
 * Load categories from categories.json
 */
export const loadCategories = (): Category[] => {
  const configPath = join(process.cwd(), 'categories.json');

  if (!existsSync(configPath)) {
    throw new Error('categories.json not found in project root');
  }

  const config: CategoriesConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
  return config.categories;
};
