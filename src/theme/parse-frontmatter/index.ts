import { parseInlineArray } from './parse-inline-array';
import { processKeyValueMatch } from './process-key-value-match';
import { saveKeyValue } from './save-key-value';

/**
 * Parse YAML frontmatter from markdown file
 */
export const parseFrontmatter = (content: string): Record<string, unknown> | null => {
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
      saveKeyValue(frontmatter, currentKey, currentValue, inArray);

      const { key, value, isInlineArray, isSimpleValue } = processKeyValueMatch(keyMatch);

      if (isInlineArray) {
        frontmatter[key] = parseInlineArray(value);
        currentKey = '';
        inArray = false;
      } else if (isSimpleValue) {
        frontmatter[key] = value.replace(/^["']|["']$/g, '');
        currentKey = '';
        inArray = false;
      } else {
        currentKey = key;
        currentValue = [];
        inArray = true;
      }
    } else if (inArray && line.trim().startsWith('- ')) {
      currentValue.push(line.trim().substring(2).trim());
    } else if (currentKey) {
      currentValue.push(line);
    }
  }

  saveKeyValue(frontmatter, currentKey, currentValue, inArray);

  return frontmatter;
};
