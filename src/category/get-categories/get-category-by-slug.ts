import { loadCategories } from '../load-categories';
import { Category } from '../types';

/**
 * Get a category by slug
 */
export const getCategoryBySlug = (slug: string): Category | undefined => {
  const categories = loadCategories();
  return categories.find((cat) => cat.slug === slug);
};
