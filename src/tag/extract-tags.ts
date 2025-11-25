import { normalizeTag } from './normalize-tag';

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
