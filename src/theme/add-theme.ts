import { loadThemes } from './load-themes';
import { saveThemes } from './save-themes';
import { Theme } from './types';

/**
 * Add a new theme to the configuration
 * @param theme - The theme to add
 * @param requiresApproval - Whether the theme requires manual approval (default: true for auto-discovered)
 */
export const addTheme = (theme: Theme, requiresApproval = true): void => {
  const config = loadThemes();

  // Check if theme already exists
  if (config.themes.some((t) => t.id === theme.id)) {
    throw new Error(`Theme with id "${theme.id}" already exists`);
  }

  // Set status based on approval requirement
  if (requiresApproval && theme.metadata.auto_discovered) {
    theme.status = 'under_review';
  }

  config.themes.push(theme);
  saveThemes(config);
};
