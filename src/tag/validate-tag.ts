import { levenshteinDistance } from './levenshten-distance';
import { normalizeTag } from './normalize-tag';
import { TagValidationResult } from './types';

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
