import { join } from 'node:path';
import { loadCategories } from '../load-categories';

/**
 * Get all category directory paths
 */
export const getCategoryDirectories = (): string[] => {
  const categories = loadCategories();
  return categories.map((cat) => join(process.cwd(), 'docs', cat.slug));
};
