/**
 * Sync README GitHub Action
 *
 * Updates README.md with current categories and themes from data files.
 * Keeps documentation in sync with data definitions.
 *
 * This action reads categories and themes from their data files and generates
 * updated README sections, ensuring documentation stays current.
 */

import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { loadCategories } from '../../../src/category';
import { getActiveThemes } from '../../../src/theme';
import type { SyncReadmeOutput } from './types';

const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;
const README_PATH = join(process.cwd(), 'README.md');

/**
 * Write single-line output to GitHub Actions output file
 *
 * @param name - Output variable name
 * @param value - Output value (single line)
 */
const writeSingleLineOutput = (name: string, value: string): void => {
  if (!GITHUB_OUTPUT) {
    console.warn(`Warning: GITHUB_OUTPUT not set, cannot write output: ${name}`);
    return;
  }
  const content = `${name}=${value}\n`;
  appendFileSync(GITHUB_OUTPUT, content);
};

/**
 * Generate theme sections for README
 *
 * @returns Formatted theme section content
 */
function generateThemeSection(): string {
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
        .map((slug: string) => {
          // Convert slug to title case
          return slug
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        })
        .join(', ');
      content += `**Related categories:** ${categoryNames}\n\n`;
    }
  }

  return content;
}

/**
 * Generate category sections for README
 *
 * @returns Formatted categories section content
 */
function generateCategorySections(): string {
  const categories = loadCategories();
  let content = '## Categories\n\n';

  for (const category of categories) {
    content += `### ${category.title}\n\n`;
    content += `${category.description}\n\n`;
  }

  return content;
}

/**
 * Update README.md with current categories and themes
 *
 * @returns Information about the sync operation
 * @throws Error if README file cannot be read or written
 */
export function syncReadme(): SyncReadmeOutput {
  const themes = getActiveThemes();
  const categories = loadCategories();

  // Read current README
  let readme = readFileSync(README_PATH, 'utf-8');

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
  writeFileSync(README_PATH, readme, 'utf-8');
  console.log('✅ README.md synced successfully');

  return {
    success: true,
    themesCount: themes.length,
    categoriesCount: categories.length,
    message: `Successfully synced README with ${themes.length} themes and ${categories.length} categories`,
  };
}

/**
 * Main entry point for GitHub Action
 */
async function main(): Promise<void> {
  try {
    console.log('Syncing README.md with current data');

    const result = syncReadme();

    // Write outputs to GitHub Actions
    writeSingleLineOutput('success', String(result.success));
    writeSingleLineOutput('themes_count', String(result.themesCount));
    writeSingleLineOutput('categories_count', String(result.categoriesCount));
    writeSingleLineOutput('message', result.message);

    console.log(`✓ README sync completed: ${result.message}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error syncing README: ${message}`);
    process.exit(1);
  }
}

// Run the action
if (require.main === module) {
  main();
}
