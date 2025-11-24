/**
 * Tag management utilities
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getSuggestedTags } from './themes.js';
import type { ToolMetadata } from './themes.js';

export interface TagValidationResult {
  valid: boolean;
  normalized: string;
  suggestion?: string;
}

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Normalize tag to consistent format (lowercase, hyphenated, singular approximation)
 */
export const normalizeTag = (tag: string): string => {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Validate tag and suggest alternatives if close match found
 * Returns { valid: boolean, normalized: string, suggestion?: string }
 */
export const validateTag = (tag: string, suggestedTags: string[]): TagValidationResult => {
  const normalized = normalizeTag(tag);

  // Check if tag is empty after normalization
  if (!normalized) {
    return {
      valid: false,
      normalized: '',
      suggestion: undefined,
    };
  }

  // Check if exact match exists
  if (suggestedTags.includes(normalized)) {
    return {
      valid: true,
      normalized,
    };
  }

  // Find close matches (Levenshtein distance <= 2)
  const closeMatches = suggestedTags.filter(
    (suggestedTag) => levenshteinDistance(normalized, suggestedTag) <= 2,
  );

  if (closeMatches.length > 0) {
    return {
      valid: true,
      normalized,
      suggestion: closeMatches[0],
    };
  }

  // Tag is valid but not in suggested list
  return {
    valid: true,
    normalized,
  };
};

/**
 * Extract tags from GitHub repository metadata
 * This is a placeholder - in production, this would use GitHub API
 */
export const extractTags = (repoData: {
  topics?: string[];
  language?: string;
  description?: string;
}): string[] => {
  const tags: string[] = [];

  // Add topics as tags
  if (repoData.topics && Array.isArray(repoData.topics)) {
    tags.push(...repoData.topics.map(normalizeTag));
  }

  // Add language as a tag
  if (repoData.language) {
    tags.push(normalizeTag(repoData.language));
  }

  // Extract potential tags from description (basic keyword extraction)
  if (repoData.description) {
    const keywords = ['cli', 'api', 'web', 'mobile', 'testing', 'security'];
    const description = repoData.description.toLowerCase();
    keywords.forEach((keyword) => {
      if (description.includes(keyword)) {
        tags.push(keyword);
      }
    });
  }

  // Remove duplicates and normalize
  return [...new Set(tags.map(normalizeTag))].filter((tag) => tag.length > 0);
};

/**
 * Parse frontmatter from markdown file
 */
const parseFrontmatter = (content: string): Record<string, unknown> => {
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
      // Array item
      const value = line.trim().substring(1).trim();
      if (Array.isArray(currentValue)) {
        currentValue.push(value);
      }
    } else if (line.includes(':')) {
      // New key-value pair
      if (currentKey && currentValue !== '') {
        frontmatter[currentKey] = currentValue;
      }

      const [key, ...valueParts] = line.split(':');
      currentKey = key.trim();
      const value = valueParts.join(':').trim();

      if (value === '') {
        // Might be start of array
        currentValue = [];
        inArray = true;
      } else {
        currentValue = value.replace(/^['"]|['"]$/g, '');
        inArray = false;
      }
    }
  }

  if (currentKey && currentValue !== '') {
    frontmatter[currentKey] = currentValue;
  }

  return frontmatter;
};

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

        if (frontmatter.tool_name && frontmatter.repository) {
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

/**
 * Find tools sharing one or more tags
 */
export const getRelatedTools = (tags: string[]): ToolMetadata[] => {
  const allTools = getAllTools();
  const normalizedSearchTags = tags.map(normalizeTag);

  return allTools.filter((tool) => {
    const toolTags = tool.tags.map(normalizeTag);
    return normalizedSearchTags.some((searchTag) => toolTags.includes(searchTag));
  });
};

/**
 * Get all unique tags used across tools
 */
export const getAllUsedTags = (): string[] => {
  const allTools = getAllTools();
  const tags = new Set<string>();

  for (const tool of allTools) {
    for (const tag of tool.tags) {
      tags.add(normalizeTag(tag));
    }
  }

  return Array.from(tags).sort();
};

/**
 * Validate multiple tags and return results
 */
export const validateTags = (tags: string[]): TagValidationResult[] => {
  const suggestedTags = getSuggestedTags();
  return tags.map((tag) => validateTag(tag, suggestedTags));
};

/**
 * Get tag statistics (frequency across tools)
 */
export const getTagStats = (): Map<string, number> => {
  const allTools = getAllTools();
  const tagCount = new Map<string, number>();

  for (const tool of allTools) {
    for (const tag of tool.tags) {
      const normalized = normalizeTag(tag);
      tagCount.set(normalized, (tagCount.get(normalized) || 0) + 1);
    }
  }

  return tagCount;
};

/**
 * Suggest popular tags based on usage frequency
 */
export const getPopularTags = (minCount = 3): string[] => {
  const tagStats = getTagStats();
  return Array.from(tagStats.entries())
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
};
