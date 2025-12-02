import { ToolMetadata } from '../types';
import { parseFrontmatter } from '../../tags/parse-frontmatter';

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Get all tools with their metadata from docs directory
 */
export const getAllTools = (): ToolMetadata[] => {
  const tools: ToolMetadata[] = [];
  const docsPath = join(process.cwd(), 'docs');

  try {
    const categories = readdirSync(docsPath, { withFileTypes: true }).filter((dirent) =>
      dirent.isDirectory(),
    );

    for (const category of categories) {
      const categoryPath = join(docsPath, category.name);
      const files = readdirSync(categoryPath).filter((file) => file.endsWith('.md'));

      for (const file of files) {
        const filePath = join(categoryPath, file);
        const content = readFileSync(filePath, 'utf-8');
        const frontmatter = parseFrontmatter(content);

        if (frontmatter && frontmatter.tool_name && frontmatter.repository) {
          tools.push({
            tool_name: String(frontmatter.tool_name),
            category: category.name,
            themes: (frontmatter.themes as ToolMetadata['themes']) || {
              primary: '',
              secondary: [],
            },
            tags: (frontmatter.tags as string[]) || [],
            repository: String(frontmatter.repository),
          });
        }
      }
    }
  } catch (error) {
    console.error('Error reading tools:', error);
  }

  return tools;
};
