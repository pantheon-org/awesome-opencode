/**
 * Process an array item line
 */
const processArrayItem = (line: string, currentValue: unknown): void => {
  const value = line.trim().substring(1).trim();
  if (Array.isArray(currentValue)) {
    currentValue.push(value);
  }
};

/**
 * Parse a key-value line
 */
const parseKeyValueLine = (line: string): { key: string; value: string; isArray: boolean } => {
  const [key, ...valueParts] = line.split(':');
  const trimmedKey = key.trim();
  const value = valueParts.join(':').trim();

  if (value === '') {
    return { key: trimmedKey, value: '', isArray: true };
  }

  return {
    key: trimmedKey,
    value: value.replace(/^['"]|['"]$/g, ''),
    isArray: false,
  };
};

/**
 * Save current key-value to frontmatter
 */
const saveCurrentKeyValue = (
  frontmatter: Record<string, unknown>,
  currentKey: string,
  currentValue: unknown,
): void => {
  if (currentKey && currentValue !== '') {
    frontmatter[currentKey] = currentValue;
  }
};

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
