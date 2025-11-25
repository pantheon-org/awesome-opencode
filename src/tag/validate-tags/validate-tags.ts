import { getSuggestedTags } from '../../theme';
import { TagValidationResult } from '../types';
import { validateTag } from './validate-tag';

/**
 * Validate multiple tags and return results
 */
export const validateTags = (tags: string[]): TagValidationResult[] => {
  const suggestedTags = getSuggestedTags();
  return tags.map((tag) => validateTag(tag, suggestedTags));
};
