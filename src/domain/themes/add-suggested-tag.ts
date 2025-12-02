import { loadThemes } from './load-themes';
import { saveThemes } from './save-themes';

/**
 * Add a suggested tag if it doesn't already exist
 */
export const addSuggestedTag = (tag: string): void => {
  const config = loadThemes();

  if (!config.suggested_tags.includes(tag)) {
    config.suggested_tags.push(tag);
    config.suggested_tags.sort();
    saveThemes(config);
  }
};
