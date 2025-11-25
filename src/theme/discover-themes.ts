import { getAllTools, getTagStats, normalizeTag } from '../tag';
import { ThemeCandidate } from './types';

/**
 * Discover themes from existing tools using tag clustering
 */
export const discoverThemes = (): ThemeCandidate[] => {
  const allTools = getAllTools();
  const tagStats = getTagStats();
  const themes: ThemeCandidate[] = [];

  // Get popular tags (appearing in 3+ tools)
  const popularTags = Array.from(tagStats.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  // Group tools by popular tags
  for (const tag of popularTags) {
    const toolsWithTag = allTools.filter((tool) => tool.tags.map(normalizeTag).includes(tag));

    if (toolsWithTag.length < 3) continue;

    // Find related tags (co-occurring tags)
    const relatedTags = new Map<string, number>();
    for (const tool of toolsWithTag) {
      for (const toolTag of tool.tags) {
        const normalized = normalizeTag(toolTag);
        if (normalized !== tag) {
          relatedTags.set(normalized, (relatedTags.get(normalized) || 0) + 1);
        }
      }
    }

    // Get top related tags
    const keywords = [
      tag,
      ...Array.from(relatedTags.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([t]) => t),
    ];

    // Get categories represented
    const toolCategories = [...new Set(toolsWithTag.map((tool) => tool.category))];

    // Calculate confidence
    const confidence = calculateConfidence(
      toolsWithTag.map((t) => t.tool_name),
      keywords,
      toolCategories,
    );

    // Generate theme candidate
    const themeId = `${tag}-tools`;
    const themeName = tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    themes.push({
      id: themeId,
      name: `${themeName} Tools`,
      description: `Tools focused on ${tag} capabilities and workflows`,
      keywords,
      categories: toolCategories,
      tools: toolsWithTag.map((t) => t.tool_name),
      confidence,
    });
  }

  return themes;
};
