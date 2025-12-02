import { getAllTools } from '../../tools';
import { normalizeTag } from '../normalize-tag';

/**
 * Get all unique tags used across tools
 */
export const getAllUsedTags = (): string[] => {
  const allTools = getAllTools();
  const tags = new Set<string>();

  for (const tool of allTools) {
    for (const tag of tool.tags) {
      tags.add(normalizeTag(tag));
    }
  }

  return Array.from(tags).sort();
};
