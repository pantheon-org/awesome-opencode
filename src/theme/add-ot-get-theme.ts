import { loadThemes } from './load-themes';
import { saveThemes } from './save-themes';
import { Theme } from './types';

/**
 * Add a new theme or return existing if it already exists
 * Used during tool submission to handle auto-discovered themes
 * @param themeData - Partial theme data from OpenCode
 * @returns The theme ID
 */
export const addOrGetTheme = (themeData: {
  id: string;
  name: string;
  description: string;
  keywords?: string[];
  categories?: string[];
}): string => {
  const config = loadThemes();
  const existingTheme = config.themes.find((t) => t.id === themeData.id);

  if (existingTheme) {
    return existingTheme.id;
  }

  // Create new theme with pending-review status
  const newTheme: Theme = {
    id: themeData.id,
    name: themeData.name,
    description: themeData.description,
    keywords: themeData.keywords || [],
    categories: themeData.categories || [],
    status: 'under_review',
    metadata: {
      auto_discovered: true,
      tool_count: 1,
      created_date: new Date().toISOString().split('T')[0],
      approved_by: null,
    },
  };

  config.themes.push(newTheme);
  saveThemes(config);

  return newTheme.id;
};
