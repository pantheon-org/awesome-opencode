import { loadThemes } from './load-themes';
import { saveThemes } from './save-themes';
import type { Theme } from './types';

/**
 * Increment tool count for themes
 * @param themeIds - Array of theme IDs to increment
 */
export const incrementThemeToolCounts = (themeIds: string[]): void => {
  const config = loadThemes();
  let modified = false;

  for (const themeId of themeIds) {
    const theme = config.themes.find((t: Theme) => t.id === themeId);
    if (theme) {
      theme.metadata.tool_count += 1;
      modified = true;
    }
  }

  if (modified) {
    saveThemes(config);
  }
};
