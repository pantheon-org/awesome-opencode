import { ToolInfo } from '../types';

/**
 * Get tools for a specific theme
 */
export const getToolsForTheme = (themeId: string, allTools: ToolInfo[]): ToolInfo[] => {
  return allTools
    .filter((tool) => tool.themes.includes(themeId))
    .sort((a, b) => a.tool_name.localeCompare(b.tool_name));
};
