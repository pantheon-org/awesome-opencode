import { loadThemes } from './load-themes';

/**
 * Get suggested tags list
 */
export const getSuggestedTags = (): string[] => {
  const config = loadThemes();
  return config.suggested_tags;
};
