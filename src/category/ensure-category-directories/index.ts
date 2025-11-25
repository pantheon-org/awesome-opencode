/**
 * Ensure all category directories exist
 * This script creates any missing category directories based on categories.json
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCategories } from '../load-categories';

const DOCS_DIR = join(process.cwd(), 'docs');

/**
 * Ensure all category directories exist
 */
export const ensureCategoryDirectories = (): void => {
  const categories = loadCategories();
  let created = 0;
  let existed = 0;

  for (const category of categories) {
    const dirPath = join(DOCS_DIR, category.slug);

    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });

      // Create a .gitkeep file to ensure the directory is tracked
      const gitkeepPath = join(dirPath, '.gitkeep');
      writeFileSync(gitkeepPath, '', 'utf-8');

      console.log(`✅ Created category directory: ${category.slug}/`);
      created++;
    } else {
      existed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Already existed: ${existed}`);
  console.log(`   Total categories: ${categories.length}`);
};
