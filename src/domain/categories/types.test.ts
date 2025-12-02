import { describe, expect, test } from 'bun:test';
import { CategorySchema, CategoriesConfigSchema } from './types';

describe('CategorySchema', () => {
  test('should parse valid Category', () => {
    const validData = {
      slug: 'ai-coding-assistants',
      title: 'AI Coding Assistants',
      description: 'AI-powered tools that help with coding',
    };

    const result = CategorySchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should reject missing required fields', () => {
    const invalidData = {
      slug: 'test-category',
    };

    expect(() => CategorySchema.parse(invalidData)).toThrow();
  });

  test('should reject wrong types', () => {
    const invalidData = {
      slug: 123,
      title: 'Test',
      description: 'Test description',
    };

    expect(() => CategorySchema.parse(invalidData)).toThrow();
  });

  test('should handle empty strings', () => {
    const dataWithEmptyStrings = {
      slug: '',
      title: '',
      description: '',
    };

    const result = CategorySchema.parse(dataWithEmptyStrings);
    expect(result.slug).toBe('');
  });
});

describe('CategoriesConfigSchema', () => {
  test('should parse valid CategoriesConfig', () => {
    const validData = {
      categories: [
        {
          slug: 'ai-coding-assistants',
          title: 'AI Coding Assistants',
          description: 'AI-powered coding tools',
        },
        {
          slug: 'testing-tools',
          title: 'Testing Tools',
          description: 'Tools for testing code',
        },
      ],
    };

    const result = CategoriesConfigSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should parse empty categories array', () => {
    const validData = {
      categories: [],
    };

    const result = CategoriesConfigSchema.parse(validData);

    expect(result.categories).toEqual([]);
  });

  test('should reject missing categories field', () => {
    const invalidData = {};

    expect(() => CategoriesConfigSchema.parse(invalidData)).toThrow();
  });

  test('should reject non-array categories', () => {
    const invalidData = {
      categories: 'not-an-array',
    };

    expect(() => CategoriesConfigSchema.parse(invalidData)).toThrow();
  });

  test('should reject invalid category objects', () => {
    const invalidData = {
      categories: [
        {
          slug: 'valid-category',
          title: 'Valid Category',
          // missing description
        },
      ],
    };

    expect(() => CategoriesConfigSchema.parse(invalidData)).toThrow();
  });

  test('should provide clear error messages with safeParse', () => {
    const invalidData = {
      categories: [
        {
          slug: 'test',
          // missing title and description
        },
      ],
    };

    const result = CategoriesConfigSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
