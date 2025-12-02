import { loadThemes } from '../load-themes';
import { Theme } from '../types';

/**
 * Get a theme by ID
 */
export const getThemeById = (id: string): Theme | undefined => {
  const config = loadThemes();
  return config.themes.find((theme) => theme.id === id);
};
