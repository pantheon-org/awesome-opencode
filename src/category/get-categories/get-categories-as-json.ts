import { loadCategories } from '../load-categories';

/**
 * Get category list as JSON string for workflows
 */
export const getCategoriesAsJson = (): string => {
  const categories = loadCategories();
  return JSON.stringify(categories, null, 2);
};
