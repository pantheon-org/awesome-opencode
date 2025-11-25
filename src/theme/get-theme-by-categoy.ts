import { loadThemes } from './load-themes';
import { Theme } from './types';

/**
 * Get themes by category
 */
export const getThemesByCategory = (categorySlug: string): Theme[] => {
  const config = loadThemes();
  return config.themes.filter(
    (theme) => theme.status === 'active' && theme.categories.includes(categorySlug),
  );
};
