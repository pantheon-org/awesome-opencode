import { describe, expect, test } from 'bun:test';
import { validateTag } from './validate-tag';

describe('validateTag', () => {
  const suggestedTags = ['javascript', 'typescript', 'testing', 'ai-powered', 'code-quality'];

  test('should return invalid for empty tag after normalization', () => {
    const result = validateTag('!!!', suggestedTags);
    expect(result.valid).toBe(false);
    expect(result.normalized).toBe('');
    expect(result.suggestion).toBeUndefined();
  });

  test('should return valid with exact match', () => {
    const result = validateTag('javascript', suggestedTags);
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('javascript');
    expect(result.suggestion).toBeUndefined();
  });

  test('should normalize and find exact match', () => {
    const result = validateTag('JavaScript', suggestedTags);
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('javascript');
    expect(result.suggestion).toBeUndefined();
  });

  test('should suggest close match with Levenshtein distance <= 2', () => {
    const result = validateTag('javascrip', suggestedTags); // distance 1 from 'javascript'
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('javascrip');
    expect(result.suggestion).toBe('javascript');
  });

  test('should suggest close match for typo', () => {
    const result = validateTag('typescipt', suggestedTags); // distance 1 from 'typescript'
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('typescipt');
    expect(result.suggestion).toBe('typescript');
  });

  test('should return valid without suggestion for new tag', () => {
    const result = validateTag('new-tag', suggestedTags);
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('new-tag');
    expect(result.suggestion).toBeUndefined();
  });

  test('should handle tag with spaces and underscores', () => {
    const result = validateTag('ai_powered', suggestedTags);
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('ai-powered');
    expect(result.suggestion).toBeUndefined();
  });

  test('should not suggest when distance > 2', () => {
    const result = validateTag('python', suggestedTags); // distance > 2 from all tags
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('python');
    expect(result.suggestion).toBeUndefined();
  });
});
