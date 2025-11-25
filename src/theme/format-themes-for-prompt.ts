import { getActiveThemes } from './get-themes';

/**
 * Format themes for OpenCode prompt
 */
export const formatThemesForPrompt = (): string => {
  const themes = getActiveThemes();
  return themes
    .map(
      (theme) =>
        `   - ${theme.id}: ${theme.description}\n     Keywords: ${theme.keywords.join(', ')}`,
    )
    .join('\n');
};
