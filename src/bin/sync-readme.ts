#!/usr/bin/env bun
/**
 * Sync README.md with categories.json and themes.json
 * This script updates the README.md file to reflect the current categories
 * and themes defined in the data files
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCategories } from '../domain/categories';
import { getActiveThemes } from '../domain/themes';

const README_PATH = join(process.cwd(), 'README.md');

/**
 * Generate theme sections for README
 */
const generateThemeSection = (): string => {
  const themes = getActiveThemes();
  let content = '## Browse by Theme\n\n';
  content += 'Discover tools organized by their primary purpose and philosophy:\n\n';

  for (const theme of themes) {
    // Convert theme ID to emoji (simple mapping, could be enhanced)
    const emoji = theme.id.includes('ai') ? '🤖' : theme.id.includes('productivity') ? '⚡' : '🔒';
    content += `### ${emoji} [${theme.name}](docs/themes/${theme.id}.md)\n\n`;
    content += `${theme.description}\n\n`;

    // Show related categories
    if (theme.categories && theme.categories.length > 0) {
      const categoryNames = theme.categories
        .map((slug) => {
          // Convert slug to title case
          return slug
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        })
        .join(', ');
      content += `**Related categories:** ${categoryNames}\n\n`;
    }
  }

  return content;
};

/**
 * Generate category sections for README
 */
const generateCategorySections = (): string => {
  const categories = loadCategories();
  let content = '## Categories\n\n';

  for (const category of categories) {
    content += `### ${category.title}\n\n`;
    content += `${category.description}\n\n`;
  }

  return content;
};

/**
 * Update README.md with current categories and themes
 */
const syncReadme = (): void => {
  const readmePath = README_PATH;

  // Read current README
  let readme = readFileSync(readmePath, 'utf-8');

  // Generate new theme section
  const newThemeSection = generateThemeSection();

  // Find and replace theme section
  // Pattern: from "## Browse by Theme" to the next "##"
  const themeRegex = /(## Browse by Theme\n\n)([\s\S]*?)(?=\n## )/;

  if (themeRegex.test(readme)) {
    readme = readme.replace(themeRegex, newThemeSection + '\n');
    console.log('✅ Updated existing theme section');
  } else {
    // If no theme section exists, add it before Categories section
    const categoryIndex = readme.indexOf('## Categories');
    if (categoryIndex !== -1) {
      readme =
        readme.slice(0, categoryIndex) + newThemeSection + '\n' + readme.slice(categoryIndex);
      console.log('✅ Added new theme section');
    }
  }

  // Generate new categories section
  const newCategoriesSection = generateCategorySections();

  // Find and replace categories section
  // Pattern: from "## Categories" to the next "##" or end of file
  const categoryRegex = /(## Categories\n\n)([\s\S]*?)(?=\n## |$)/;

  if (categoryRegex.test(readme)) {
    readme = readme.replace(categoryRegex, newCategoriesSection);
    console.log('✅ Updated existing categories section');
  } else {
    // If no categories section exists, add it before the License section
    const licenseIndex = readme.indexOf('## License');
    if (licenseIndex !== -1) {
      readme =
        readme.slice(0, licenseIndex) + newCategoriesSection + '\n' + readme.slice(licenseIndex);
      console.log('✅ Added new categories section');
    } else {
      // Append to end if no License section
      readme += '\n' + newCategoriesSection;
      console.log('✅ Appended categories section to end');
    }
  }

  // Write updated README
  writeFileSync(readmePath, readme, 'utf-8');
  console.log('✅ README.md synced successfully');
};

// Run the sync
try {
  syncReadme();
} catch (error) {
  console.error('❌ Error syncing README:', error);
  process.exit(1);
}
