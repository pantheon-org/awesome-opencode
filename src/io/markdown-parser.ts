/**
 * Represents parsed frontmatter data structure
 * Maps YAML frontmatter keys to their values
 */
export type FrontmatterData = Record<string, unknown>;

export interface ParsedMarkdown {
  frontmatter: FrontmatterData;
  content: string;
}

export interface ParseMarkdownOptions {
  validateFrontmatter?: boolean;
  strict?: boolean;
}

/**
 * Parses a single YAML value, handling strings, numbers, booleans, null
 * @param value - Raw value string
 * @returns Parsed value with correct type
 */
// eslint-disable-next-line complexity
const parseValue = (value: string): unknown => {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  // Handle quoted strings
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  // Handle booleans
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Handle null
  if (trimmed === 'null' || trimmed === 'nil' || trimmed === '~') return null;

  // Handle numbers
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const num = Number.parseFloat(trimmed);
    return Number.isFinite(num) ? num : trimmed;
  }

  return trimmed;
};

/**
 * Parses inline YAML array like [item1, item2, item3]
 * @param arrayStr - Array string
 * @returns Array of parsed values
 */
const parseInlineArray = (arrayStr: string): unknown[] => {
  const match = arrayStr.match(/^\[(.*)\]$/);
  if (!match) {
    return [];
  }

  const itemsStr = match[1];
  if (!itemsStr.trim()) {
    return [];
  }

  return itemsStr.split(',').map((item) => parseValue(item));
};

/**
 * Processes a single line of YAML frontmatter
 * @param line - YAML line
 * @param inArray - Whether currently parsing an array
 * @param currentValue - Current value being built
 * @returns Updated state or null if line doesn't contain key-value
 */
const processYamlLine = (
  line: string,
  inArray: boolean,
  currentValue: unknown,
): { currentKey: string; currentValue: unknown; inArray: boolean } | null => {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  // Array item
  if (trimmed.startsWith('-') && inArray) {
    const arrayValue = currentValue as unknown[];
    const itemValue = trimmed.slice(1).trim();
    arrayValue.push(parseValue(itemValue));
    return null;
  }

  // Key-value pair
  if (line.includes(':')) {
    const colonIndex = line.indexOf(':');
    const currentKey = line.substring(0, colonIndex).trim();
    const valueStr = line.substring(colonIndex + 1).trim();

    // Check if this starts an array
    if (valueStr.startsWith('[')) {
      // Inline array like: tags: [tag1, tag2]
      return { currentKey, currentValue: parseInlineArray(valueStr), inArray: false };
    }
    if (valueStr === '' || valueStr === '-') {
      // Start of array block
      return { currentKey, currentValue: [], inArray: true };
    }
    // Simple value
    return { currentKey, currentValue: parseValue(valueStr), inArray: false };
  }

  return null;
};

/**
 * Parses raw YAML frontmatter into a simple object
 * Handles key: value pairs, arrays with dashes, and quoted strings
 * @param yaml - Raw YAML string
 * @returns Parsed object
 */
const parseRawFrontmatter = (yaml: string): FrontmatterData => {
  const frontmatter: FrontmatterData = {};
  const lines = yaml.split('\n');

  let currentKey = '';
  let currentValue: unknown = '';
  let inArray = false;

  for (const line of lines) {
    const result = processYamlLine(line, inArray, currentValue);

    if (result) {
      // Save previous key-value
      if (currentKey) {
        frontmatter[currentKey] = currentValue;
      }
      currentKey = result.currentKey;
      currentValue = result.currentValue;
      inArray = result.inArray;
    }
  }

  // Save last key-value
  if (currentKey) {
    frontmatter[currentKey] = currentValue;
  }

  return frontmatter;
};

/**
 * Parses YAML frontmatter string into key-value pairs
 * Supports simple YAML format: key: value
 * @param yaml - YAML frontmatter string
 * @param strict - If true, throws on parse errors
 * @returns Parsed frontmatter object
 */
const parseYamlFrontmatter = (yaml: string, strict = false): FrontmatterData => {
  try {
    return parseRawFrontmatter(yaml);
  } catch (error) {
    if (strict) {
      throw new Error(
        `Failed to parse YAML frontmatter: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return {};
  }
};

/**
 * Formats a single YAML value based on its type
 * @param value - Value to format
 * @returns Formatted value string
 */
const formatYamlValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    // Quote if contains special characters
    if (value.includes(':') || value.includes('#') || value.includes('\n')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }

  return String(value);
};

/**
 * Formats a single YAML key-value pair
 * @param key - Key name
 * @param value - Value (can be string, number, boolean, array, etc)
 * @returns YAML line
 */
const formatYamlLine = (key: string, value: unknown): string => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${key}: []`;
    }
    const lines = [`${key}:`];
    for (const item of value) {
      lines.push(`  - ${formatYamlValue(item)}`);
    }
    return lines.join('\n');
  }

  return `${key}: ${formatYamlValue(value)}`;
};

/**
 * Formats frontmatter object back into YAML string
 * @param frontmatter - Frontmatter object
 * @returns YAML string
 */
const formatYamlFrontmatter = (frontmatter: FrontmatterData): string => {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(formatYamlLine(key, value));
  }

  return lines.join('\n');
};

/**
 * Parses markdown content extracting YAML frontmatter and content
 * Frontmatter is expected between --- markers at the top of the file
 * @param content - Raw markdown content
 * @param options - Parse options
 * @returns Object with parsed frontmatter and markdown content
 */
// eslint-disable-next-line complexity
export const parseMarkdown = (content: string, options?: ParseMarkdownOptions): ParsedMarkdown => {
  const { validateFrontmatter = false, strict = false } = options ?? {};

  if (!content) {
    return { frontmatter: {}, content: '' };
  }

  const frontmatterRegex = /^---(?:\n([\s\S]*?))?\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content };
  }

  const frontmatterRaw = match[1] || '';
  const remainingContent = content.slice(match[0].length).trim();

  try {
    const frontmatter = parseYamlFrontmatter(frontmatterRaw, strict);

    if (validateFrontmatter && Object.keys(frontmatter).length === 0) {
      console.warn('No frontmatter found in markdown content');
    }

    return {
      frontmatter,
      content: remainingContent,
    };
  } catch (error) {
    if (strict) {
      throw error;
    }
    // In non-strict mode, treat as raw frontmatter object
    return {
      frontmatter: parseRawFrontmatter(frontmatterRaw),
      content: remainingContent,
    };
  }
};

/**
 * Generates markdown content with frontmatter header
 * @param frontmatter - Frontmatter object
 * @param content - Markdown content
 * @returns Formatted markdown with frontmatter
 */
export const generateMarkdown = (frontmatter: FrontmatterData, content: string): string => {
  if (Object.keys(frontmatter).length === 0) {
    return content;
  }

  const yamlContent = formatYamlFrontmatter(frontmatter);
  return `---\n${yamlContent}\n---\n${content}`;
};

/**
 * Extracts frontmatter from markdown without full parsing
 * Returns raw YAML as object structure
 * @param content - Raw markdown content
 * @returns Frontmatter object or empty object if not found
 */
export const extractFrontmatter = (content: string): FrontmatterData => {
  if (!content) {
    return {};
  }

  const frontmatterRegex = /^---(?:\n([\s\S]*?))?\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {};
  }

  return parseRawFrontmatter(match[1] || '');
};
