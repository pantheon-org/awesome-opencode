import { ToolMetadata } from '../../tools';
import { getAllTools } from './get-all-tools';
import { normalizeTag } from '../../tags/normalize-tag';

/**
 * Find tools sharing one or more tags
 */
export const getRelatedTools = (tags: string[]): ToolMetadata[] => {
  const allTools = getAllTools();
  const normalizedSearchTags = tags.map(normalizeTag);

  return allTools.filter((tool) => {
    const toolTags = tool.tags.map(normalizeTag);
    return normalizedSearchTags.some((searchTag) => toolTags.includes(searchTag));
  });
};
