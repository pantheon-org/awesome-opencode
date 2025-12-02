import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ToolInfo } from '../tools';
import { parseFrontmatter } from './parse-frontmatter';
import { extractDescription } from './extract-description';

/**
 * Get all tools from docs/tools/ directory
 */
export const getAllTools = (): ToolInfo[] => {
  const toolsDir = join(process.cwd(), 'docs', 'tools');

  if (!existsSync(toolsDir)) {
    return [];
  }

  const files = readdirSync(toolsDir).filter(
    (f) => f.endsWith('.md') && f !== '.gitkeep' && f !== 'README.md',
  );

  const tools: ToolInfo[] = [];

  for (const file of files) {
    const filePath = join(toolsDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      console.warn(`⚠️  No frontmatter found in ${file}`);
      continue;
    }

    const description = extractDescription(content);

    tools.push({
      tool_name: (frontmatter.tool_name as string) || file.replace('.md', ''),
      repository: (frontmatter.repository as string) || '',
      category: (frontmatter.category as string) || 'uncategorized',
      themes: (frontmatter.themes as string[]) || [],
      tags: (frontmatter.tags as string[]) || [],
      submitted_date: frontmatter.submitted_date as string | undefined,
      filename: file,
      description,
    });
  }

  return tools;
};
