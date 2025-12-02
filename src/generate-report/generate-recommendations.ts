import { Theme, ThemeCandidate } from '../domain/themes';
import { ToolInfo } from '../domain/tools';

/**
 * Generate recommendations based on analysis
 */
export const generateRecommendations = (
  existingThemes: Theme[],
  highConfidence: ThemeCandidate[],
  allTools: ToolInfo[],
): string[] => {
  const recommendations: string[] = [];

  if (existingThemes.some((t) => t.metadata.tool_count < 3)) {
    recommendations.push('Some existing themes have fewer than 3 tools - consider review');
  }

  if (highConfidence.length > 0) {
    recommendations.push(`${highConfidence.length} high-confidence theme candidates discovered`);
  }

  const toolsWithoutThemes = allTools.filter((tool) => !tool.themes || tool.themes.length === 0);
  if (toolsWithoutThemes.length > 0) {
    recommendations.push(`${toolsWithoutThemes.length} tools need theme assignment`);
  }

  return recommendations;
};
