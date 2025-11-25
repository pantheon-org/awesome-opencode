import type { Theme } from '../types';
import type { ToolInfo } from '../../tool';

/**
 * Generate frontmatter section
 */
const generateFrontmatter = (theme: Theme, toolCount: number): string[] => {
  const lines: string[] = [];
  lines.push('---');
  lines.push(`theme_id: ${theme.id}`);
  lines.push(`status: ${theme.status}`);
  lines.push(`tool_count: ${toolCount}`);
  lines.push(`last_updated: ${new Date().toISOString().split('T')[0]}`);
  lines.push('---');
  lines.push('');
  return lines;
};

/**
 * Generate title and description section
 */
const generateHeader = (theme: Theme): string[] => {
  const lines: string[] = [];
  lines.push(`# ${theme.name}`);
  lines.push('');
  lines.push(theme.description);
  lines.push('');
  return lines;
};

/**
 * Generate tools section
 */
const generateToolsSection = (tools: ToolInfo[]): string[] => {
  const lines: string[] = [];

  if (tools.length > 0) {
    lines.push(`## Tools (${tools.length})`);
    lines.push('');
    for (const tool of tools) {
      lines.push(`- [${tool.tool_name}](../tools/${tool.filename}) - ${tool.description}`);
    }
  } else {
    lines.push('## Tools');
    lines.push('');
    lines.push('*No tools have been added to this theme yet.*');
  }

  lines.push('');
  return lines;
};

/**
 * Generate keywords section
 */
const generateKeywordsSection = (keywords: string[]): string[] => {
  const lines: string[] = [];

  if (keywords.length > 0) {
    lines.push('## Keywords');
    lines.push('');
    lines.push(keywords.map((k) => `\`${k}\``).join(', '));
    lines.push('');
  }

  return lines;
};

/**
 * Generate related themes section
 */
const generateRelatedThemesSection = (relatedThemes: Theme[]): string[] => {
  const lines: string[] = [];

  if (relatedThemes.length > 0) {
    lines.push('## Related Themes');
    lines.push('');
    for (const related of relatedThemes) {
      lines.push(`- [${related.name}](${related.id}.md)`);
    }
    lines.push('');
  }

  return lines;
};

/**
 * Generate footer section
 */
const generateFooter = (): string[] => {
  const lines: string[] = [];
  lines.push('---');
  lines.push('');
  lines.push(
    '*This theme page is automatically generated. [Edit theme metadata](../../data/themes.json)*',
  );
  return lines;
};

/**
 * Generate markdown content for a theme page
 */
export const generateThemePage = (
  theme: Theme,
  tools: ToolInfo[],
  relatedThemes: Theme[],
): string => {
  const sections = [
    ...generateFrontmatter(theme, tools.length),
    ...generateHeader(theme),
    ...generateToolsSection(tools),
    ...generateKeywordsSection(theme.keywords),
    ...generateRelatedThemesSection(relatedThemes),
    ...generateFooter(),
  ];

  return sections.join('\n');
};
