import { describe, expect, test } from 'bun:test';
import { normalizeTag } from './normalize-tag';

describe('normalizeTag', () => {
  test('should convert to lowercase', () => {
    expect(normalizeTag('JavaScript')).toBe('javascript');
    expect(normalizeTag('AI-POWERED')).toBe('ai-powered');
  });

  test('should replace spaces with hyphens', () => {
    expect(normalizeTag('code quality')).toBe('code-quality');
    expect(normalizeTag('test  multiple   spaces')).toBe('test-multiple-spaces');
  });

  test('should replace underscores with hyphens', () => {
    expect(normalizeTag('snake_case')).toBe('snake-case');
    expect(normalizeTag('multi_word_tag')).toBe('multi-word-tag');
  });

  test('should remove non-alphanumeric characters except hyphens', () => {
    expect(normalizeTag('test@tag!')).toBe('testtag');
    expect(normalizeTag('tag#with$special%chars')).toBe('tagwithspecialchars');
  });

  test('should remove multiple consecutive hyphens', () => {
    expect(normalizeTag('test---tag')).toBe('test-tag');
    expect(normalizeTag('multiple----hyphens')).toBe('multiple-hyphens');
  });

  test('should remove leading and trailing hyphens', () => {
    expect(normalizeTag('-leading')).toBe('leading');
    expect(normalizeTag('trailing-')).toBe('trailing');
    expect(normalizeTag('-both-')).toBe('both');
  });

  test('should handle complex combinations', () => {
    expect(normalizeTag('  Code_Quality & Testing! ')).toBe('code-quality-testing');
    expect(normalizeTag('AI__Powered--Tools')).toBe('ai-powered-tools');
  });

  test('should handle empty string', () => {
    expect(normalizeTag('')).toBe('');
  });

  test('should handle string with only special characters', () => {
    expect(normalizeTag('!!!@@@###')).toBe('');
  });
});
