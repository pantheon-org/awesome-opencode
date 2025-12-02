import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Ensure category directory exists
 */
export const ensureCategoryDirectory = (slug: string): void => {
  const dirPath = join(process.cwd(), 'docs', slug);

  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    console.log(`Created category directory: ${dirPath}`);
  }
};
