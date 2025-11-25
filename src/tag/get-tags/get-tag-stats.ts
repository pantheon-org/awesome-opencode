import { getAllTools } from '../get-tools';
import { normalizeTag } from '../normalize-tag';

/**
 * Get tag statistics (frequency across tools)
 */
export const getTagStats = (): Map<string, number> => {
  const allTools = getAllTools();
  const tagCount = new Map<string, number>();

  for (const tool of allTools) {
    for (const tag of tool.tags) {
      const normalized = normalizeTag(tag);
      tagCount.set(normalized, (tagCount.get(normalized) || 0) + 1);
    }
  }

  return tagCount;
};
