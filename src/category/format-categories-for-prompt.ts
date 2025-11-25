import { loadCategories } from './load-categories';

/**
 * Format categories for OpenCode prompt
 */
export const formatCategoriesForPrompt = (): string => {
  const categories = loadCategories();
  return categories.map((cat) => `   - ${cat.slug}: ${cat.description}`).join('\n');
};
