import { parseKeyValueLine } from './parse-key-value-line';
import { processArrayItem } from './process-array-item';
import { saveCurrentKeyValue } from './save-current-key-value';

/**
 * Parse frontmatter from markdown file
 */
export const parseFrontmatter = (content: string): Record<string, unknown> => {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {};
  }

  const frontmatter: Record<string, unknown> = {};
  const lines = match[1].split('\n');

  let currentKey = '';
  let currentValue: unknown = '';
  let inArray = false;

  for (const line of lines) {
    if (line.trim().startsWith('-') && inArray) {
      processArrayItem(line, currentValue);
    } else if (line.includes(':')) {
      saveCurrentKeyValue(frontmatter, currentKey, currentValue);

      const parsed = parseKeyValueLine(line);
      currentKey = parsed.key;
      currentValue = parsed.isArray ? [] : parsed.value;
      inArray = parsed.isArray;
    }
  }

  saveCurrentKeyValue(frontmatter, currentKey, currentValue);

  return frontmatter;
};
