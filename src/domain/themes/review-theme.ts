import { loadThemes } from './load-themes';
import { saveThemes } from './save-themes';

/**
 * Mark a theme for review
 */
export const reviewTheme = (id: string, action: 'keep' | 'archive' | 'delete'): void => {
  const config = loadThemes();
  const themeIndex = config.themes.findIndex((t) => t.id === id);

  if (themeIndex === -1) {
    throw new Error(`Theme with id "${id}" not found`);
  }

  switch (action) {
    case 'keep':
      config.themes[themeIndex].status = 'active';
      delete config.themes[themeIndex].metadata.review_date;
      delete config.themes[themeIndex].metadata.review_issue;
      break;
    case 'archive':
      config.themes[themeIndex].status = 'archived';
      break;
    case 'delete':
      config.themes.splice(themeIndex, 1);
      break;
  }

  saveThemes(config);
};
