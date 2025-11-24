#!/usr/bin/env bun
/**
 * Sync README.md with categories.json
 * This script updates the README.md file to reflect the current categories
 * defined in categories.json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCategories } from './categories';

const README_PATH = join(process.cwd(), 'README.md');

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
 * Update README.md with current categories
 */
const syncReadme = (): void => {
  const readmePath = README_PATH;

  // Read current README
  let readme = readFileSync(readmePath, 'utf-8');

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
