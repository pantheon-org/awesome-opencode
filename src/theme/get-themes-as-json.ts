import { loadThemes } from './load-themes';

/**
 * Get theme configuration as JSON string for workflows
 */
export const getThemesAsJson = (): string => {
  const config = loadThemes();
  return JSON.stringify(config, null, 2);
};
