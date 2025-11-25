import { getAllTools, normalizeTag } from '../tag';
import { loadThemes } from './load-themes';
import { saveThemes } from './save-themes';

/**
 * Update tool counts for existing themes
 */
export const updateExistingThemeCounts = (): void => {
  const config = loadThemes();
  const allTools = getAllTools();

  for (const theme of config.themes) {
    // Count tools in theme's categories with matching keywords
    const toolsInTheme = allTools.filter((tool) => {
      // Tool must be in one of the theme's categories
      if (!theme.categories.includes(tool.category)) return false;

      // Tool tags or description should match theme keywords
      const toolTags = tool.tags.map(normalizeTag);
      return theme.keywords.some((keyword) => toolTags.includes(normalizeTag(keyword)));
    });

    theme.metadata.tool_count = toolsInTheme.length;
  }

  saveThemes(config);
};
