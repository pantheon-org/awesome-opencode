import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadThemes } from '../load-themes';
import { getAllTools } from '../get-all-tools';
import { getToolsForTheme } from '../../tool';
import { getRelatedThemes } from '../get-themes';
import { generateThemePage } from './generate-theme-page';

/**
 * Main function to generate all theme pages
 */
export const generateAllThemePages = (): void => {
  console.log('🎨 Generating theme pages...\n');

  // Ensure docs/themes directory exists
  const themesDir = join(process.cwd(), 'docs', 'themes');
  if (!existsSync(themesDir)) {
    mkdirSync(themesDir, { recursive: true });
    console.log('✅ Created docs/themes/ directory');
  }

  const config = loadThemes();
  const allThemes = config.themes.filter(
    (t) => t.status === 'active' || t.status === 'under_review',
  );
  const allTools = getAllTools();

  console.log(`📊 Found ${allThemes.length} themes and ${allTools.length} tools\n`);

  let created = 0;
  let updated = 0;

  for (const theme of allThemes) {
    const themeFile = join(themesDir, `${theme.id}.md`);
    const existed = existsSync(themeFile);

    const tools = getToolsForTheme(theme.id, allTools);
    const relatedThemes = getRelatedThemes(theme.id, theme, allThemes, allTools);

    const content = generateThemePage(theme, tools, relatedThemes);
    writeFileSync(themeFile, content, 'utf-8');

    if (existed) {
      updated++;
      console.log(`  ✏️  Updated: ${theme.name} (${tools.length} tools)`);
    } else {
      created++;
      console.log(`  ✨ Created: ${theme.name} (${tools.length} tools)`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Total: ${allThemes.length}`);
  console.log('\n✅ Theme pages generated successfully!');
};
