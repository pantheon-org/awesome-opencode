import { getTagStats } from './get-tag-stats';

/**
 * Suggest popular tags based on usage frequency
 */
export const getPopularTags = (minCount = 3): string[] => {
  const tagStats = getTagStats();
  return Array.from(tagStats.entries())
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
};
