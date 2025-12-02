import { loadThemes } from '../load-themes';
import { saveThemes } from '../save-themes';
import { Theme } from '../types';

/**
 * Update an existing theme
 */
export const updateTheme = (id: string, updates: Partial<Theme>): void => {
  const config = loadThemes();
  const themeIndex = config.themes.findIndex((t) => t.id === id);

  if (themeIndex === -1) {
    throw new Error(`Theme with id "${id}" not found`);
  }

  config.themes[themeIndex] = {
    ...config.themes[themeIndex],
    ...updates,
  };

  saveThemes(config);
};
