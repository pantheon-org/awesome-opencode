/**
 * Parse inline array value
 */
const parseInlineArray = (value: string): string[] => {
  const arrayMatch = value.match(/\[(.*)\]/);
  return arrayMatch ? arrayMatch[1].split(',').map((v) => v.trim().replace(/['"]/g, '')) : [];
};

/**
 * Save current key-value pair to frontmatter
 */
const saveKeyValue = (
  frontmatter: Record<string, unknown>,
  key: string,
  value: string[],
  inArray: boolean,
): void => {
  if (!key) return;

  if (inArray) {
    frontmatter[key] = value;
  } else {
    frontmatter[key] = value.join('\n');
  }
};

/**
 * Process a key-value line match
 */
const processKeyValueMatch = (
  keyMatch: RegExpMatchArray,
): { key: string; value: string; isInlineArray: boolean; isSimpleValue: boolean } => {
  const key = keyMatch[1];
  const value = keyMatch[2].trim();

  const isInlineArray = value.startsWith('[');
  const isSimpleValue = value !== '' && !isInlineArray;

  return { key, value, isInlineArray, isSimpleValue };
};

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
