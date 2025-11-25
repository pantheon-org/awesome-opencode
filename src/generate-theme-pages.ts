#!/usr/bin/env bun
/**
 * Generate Theme Pages Script
 * Automatically generates markdown pages for each theme in docs/themes/
 * by scanning tools in docs/tools/ and organizing them by theme
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadThemes, type Theme } from './themes.js';

interface ToolFrontmatter {
  tool_name: string;
  repository: string;
  category: string;
  themes: string[];
  tags: string[];
  submitted_date?: string;
}

interface ToolInfo extends ToolFrontmatter {
  filename: string;
  description: string;
}

/**
 * Parse YAML frontmatter from markdown file
 */
const parseFrontmatter = (content: string): Record<string, unknown> | null => {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter: Record<string, unknown> = {};
  const lines = frontmatterMatch[1].split('\n');

  let currentKey = '';
  let currentValue: string[] = [];
  let inArray = false;

  for (const line of lines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);

    if (keyMatch) {
      // Save previous key-value if exists
      if (currentKey && inArray) {
        frontmatter[currentKey] = currentValue;
      } else if (currentKey) {
        frontmatter[currentKey] = currentValue.join('\n');
      }

      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();

      if (value.startsWith('[')) {
        // Inline array
        const arrayMatch = value.match(/\[(.*)\]/);
        frontmatter[currentKey] = arrayMatch
          ? arrayMatch[1].split(',').map((v) => v.trim().replace(/['"]/g, ''))
          : [];
        currentKey = '';
        inArray = false;
      } else if (value) {
        // Simple value
        frontmatter[currentKey] = value.replace(/^["']|["']$/g, '');
        currentKey = '';
        inArray = false;
      } else {
        // Multi-line or array
        currentValue = [];
        inArray = true;
      }
    } else if (inArray && line.trim().startsWith('- ')) {
      // Array item
      currentValue.push(line.trim().substring(2).trim());
    } else if (currentKey) {
      // Multi-line value
      currentValue.push(line);
    }
  }

  // Save last key-value
  if (currentKey && inArray) {
    frontmatter[currentKey] = currentValue;
  } else if (currentKey) {
    frontmatter[currentKey] = currentValue.join('\n');
  }

  return frontmatter;
};

/**
 * Extract description from markdown content
 */
const extractDescription = (content: string): string => {
  // Remove frontmatter
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Look for **Description:** line
  const descMatch = withoutFrontmatter.match(/\*\*Description:\*\*\s*(.+)/);
  if (descMatch) {
    return descMatch[1].trim();
  }

  // Fallback: get first paragraph after title
  const lines = withoutFrontmatter.split('\n').filter((l) => l.trim());
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] && !lines[i].startsWith('#') && !lines[i].startsWith('**')) {
      return lines[i].trim();
    }
  }

  return 'No description available';
};

/**
 * Get all tools from docs/tools/ directory
 */
const getAllTools = (): ToolInfo[] => {
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

/**
 * Get tools for a specific theme
 */
const getToolsForTheme = (themeId: string, allTools: ToolInfo[]): ToolInfo[] => {
  return allTools
    .filter((tool) => tool.themes.includes(themeId))
    .sort((a, b) => a.tool_name.localeCompare(b.tool_name));
};

/**
 * Find related themes (themes that share tools)
 */
const getRelatedThemes = (
  themeId: string,
  theme: Theme,
  allThemes: Theme[],
  allTools: ToolInfo[],
): Theme[] => {
  const themeTools = getToolsForTheme(themeId, allTools);
  const relatedThemeIds = new Set<string>();

  // Find themes that share tools with this theme
  for (const tool of themeTools) {
    for (const otherThemeId of tool.themes) {
      if (otherThemeId !== themeId) {
        relatedThemeIds.add(otherThemeId);
      }
    }
  }

  // Also include themes in the same categories
  for (const otherTheme of allThemes) {
    if (
      otherTheme.id !== themeId &&
      otherTheme.categories.some((cat) => theme.categories.includes(cat))
    ) {
      relatedThemeIds.add(otherTheme.id);
    }
  }

  return allThemes.filter((t) => relatedThemeIds.has(t.id));
};

/**
 * Generate markdown content for a theme page
 */
const generateThemePage = (theme: Theme, tools: ToolInfo[], relatedThemes: Theme[]): string => {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`theme_id: ${theme.id}`);
  lines.push(`status: ${theme.status}`);
  lines.push(`tool_count: ${tools.length}`);
  lines.push(`last_updated: ${new Date().toISOString().split('T')[0]}`);
  lines.push('---');
  lines.push('');

  // Title and description
  lines.push(`# ${theme.name}`);
  lines.push('');
  lines.push(theme.description);
  lines.push('');

  // Tools section
  if (tools.length > 0) {
    lines.push(`## Tools (${tools.length})`);
    lines.push('');

    for (const tool of tools) {
      lines.push(`- [${tool.tool_name}](../tools/${tool.filename}) - ${tool.description}`);
    }
    lines.push('');
  } else {
    lines.push('## Tools');
    lines.push('');
    lines.push('*No tools have been added to this theme yet.*');
    lines.push('');
  }

  // Keywords section
  if (theme.keywords.length > 0) {
    lines.push('## Keywords');
    lines.push('');
    lines.push(theme.keywords.map((k) => `\`${k}\``).join(', '));
    lines.push('');
  }

  // Related themes section
  if (relatedThemes.length > 0) {
    lines.push('## Related Themes');
    lines.push('');
    for (const related of relatedThemes) {
      lines.push(`- [${related.name}](${related.id}.md)`);
    }
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(
    '*This theme page is automatically generated. [Edit theme metadata](../../themes.json)*',
  );

  return lines.join('\n');
};

/**
 * Main function to generate all theme pages
 */
const generateAllThemePages = (): void => {
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

// Run the script
try {
  generateAllThemePages();
} catch (error) {
  console.error('❌ Error generating theme pages:', error);
  process.exit(1);
}
