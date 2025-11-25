import { Theme } from '../theme';

/**
 * Display existing themes
 */
export const displayExistingThemes = (existingThemes: Theme[]): void => {
  console.log('📚 Existing Themes:\n');
  for (const theme of existingThemes) {
    console.log(`   ${theme.name} (${theme.metadata.tool_count} tools)`);
    console.log(`   └─ Keywords: ${theme.keywords.slice(0, 5).join(', ')}`);
    console.log(`   └─ Categories: ${theme.categories.join(', ')}\n`);
  }
};
