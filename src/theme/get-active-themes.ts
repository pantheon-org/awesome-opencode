import { loadThemes } from './load-themes';
import { Theme } from './types';

/**
 * Get all active themes
 */
export const getActiveThemes = (): Theme[] => {
  const config = loadThemes();
  return config.themes.filter((theme) => theme.status === 'active');
};
