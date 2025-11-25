/**
 * Category management utilities
 */
import { ensureCategoryDirectories } from './ensure-category-directories';
export { loadCategories } from './load-categories';
export { formatCategoriesForPrompt } from './format-categories-for-prompt';

// Run the check
try {
  ensureCategoryDirectories();
} catch (error) {
  console.error('❌ Error ensuring category directories:', error);
  process.exit(1);
}
