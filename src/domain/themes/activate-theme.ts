import { loadThemes } from './load-themes';
import { saveThemes } from './save-themes';

/**
 * Activate pending themes (change status from under_review to active)
 * Called during PR merge workflow
 * @param themeIds - Array of theme IDs to activate
 */
export const activateThemes = (themeIds: string[]): void => {
  const config = loadThemes();
  let modified = false;

  for (const themeId of themeIds) {
    const theme = config.themes.find((t) => t.id === themeId);
    if (theme && theme.status === 'under_review') {
      theme.status = 'active';
      theme.metadata.approved_by = 'manual';
      modified = true;
    }
  }

  if (modified) {
    saveThemes(config);
  }
};
