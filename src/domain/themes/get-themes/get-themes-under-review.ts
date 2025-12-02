import { loadThemes } from '../load-themes';
import { Theme } from '../types';

/**
 * Get all themes under review
 */
export const getThemesUnderReview = (): Theme[] => {
  const config = loadThemes();
  return config.themes.filter((theme) => theme.status === 'under_review');
};
