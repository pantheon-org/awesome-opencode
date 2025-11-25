import { getToolsForTheme } from './get-tools-for-theme';
import { Theme, ToolInfo } from './types';

/**
 * Find related themes (themes that share tools)
 */
export const getRelatedThemes = (
  themeId: string,
  theme: Theme,
  allThemes: Theme[],
  allTools: ToolInfo[],
): Theme[] => {
  const themeTools = getToolsForTheme(themeId, allTools);
  const relatedThemeIds = new Set<string>();

  // Find themes that share tools with this theme
  for (const tool of themeTools) {
    for (const otherThemeId of tool.themes) {
      if (otherThemeId !== themeId) {
        relatedThemeIds.add(otherThemeId);
      }
    }
  }

  // Also include themes in the same categories
  for (const otherTheme of allThemes) {
    if (
      otherTheme.id !== themeId &&
      otherTheme.categories.some((cat) => theme.categories.includes(cat))
    ) {
      relatedThemeIds.add(otherTheme.id);
    }
  }

  return allThemes.filter((t) => relatedThemeIds.has(t.id));
};
