/**
 * Category management utilities
 */

import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export interface Category {
  slug: string;
  title: string;
  description: string;
}

export interface CategoriesConfig {
  categories: Category[];
}

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

/**
 * Get a category by slug
 */
export const getCategoryBySlug = (slug: string): Category | undefined => {
  const categories = loadCategories();
  return categories.find((cat) => cat.slug === slug);
};

/**
 * Ensure category directory exists
 */
export const ensureCategoryDirectory = (slug: string): void => {
  const dirPath = join(process.cwd(), 'docs', slug);

  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    console.log(`Created category directory: ${dirPath}`);
  }
};

/**
 * Get all category directory paths
 */
export const getCategoryDirectories = (): string[] => {
  const categories = loadCategories();
  return categories.map((cat) => join(process.cwd(), 'docs', cat.slug));
};

/**
 * Format categories for OpenCode prompt
 */
export const formatCategoriesForPrompt = (): string => {
  const categories = loadCategories();
  return categories.map((cat) => `   - ${cat.slug}: ${cat.description}`).join('\n');
};

/**
 * Get category list as JSON string for workflows
 */
export const getCategoriesAsJson = (): string => {
  const categories = loadCategories();
  return JSON.stringify(categories, null, 2);
};
