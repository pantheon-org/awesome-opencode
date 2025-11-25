import { loadThemes } from './load-themes';
import { saveThemes } from './save-themes';

/**
 * Update theme tool count
 */
export const updateThemeToolCount = (id: string, count: number): void => {
  const config = loadThemes();
  const theme = config.themes.find((t) => t.id === id);

  if (!theme) {
    throw new Error(`Theme with id "${id}" not found`);
  }

  theme.metadata.tool_count = count;

  // Check if theme should enter review
  if (count < 3 && theme.status === 'active') {
    theme.status = 'under_review';
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 30);
    theme.metadata.review_date = reviewDate.toISOString().split('T')[0];
  }

  saveThemes(config);
};
