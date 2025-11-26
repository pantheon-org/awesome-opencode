import { describe, expect, test } from 'bun:test';
import { TagValidationResultSchema } from './types';

describe('TagValidationResultSchema', () => {
  describe('valid data', () => {
    test('should parse valid TagValidationResult with all fields', () => {
      const validData = {
        valid: true,
        normalized: 'test-tag',
        suggestion: 'alternative-tag',
      };

      const result = TagValidationResultSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    test('should parse valid TagValidationResult without optional suggestion', () => {
      const validData = {
        valid: false,
        normalized: 'normalized-tag',
      };

      const result = TagValidationResultSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    test('should use safeParse and return success for valid data', () => {
      const validData = {
        valid: true,
        normalized: 'another-tag',
      };

      const result = TagValidationResultSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });
  });

  describe('invalid data', () => {
    test('should reject missing valid field', () => {
      const invalidData = {
        normalized: 'test-tag',
      };

      expect(() => TagValidationResultSchema.parse(invalidData)).toThrow();
    });

    test('should reject missing normalized field', () => {
      const invalidData = {
        valid: true,
      };

      expect(() => TagValidationResultSchema.parse(invalidData)).toThrow();
    });

    test('should reject wrong type for valid field', () => {
      const invalidData = {
        valid: 'true', // string instead of boolean
        normalized: 'test-tag',
      };

      expect(() => TagValidationResultSchema.parse(invalidData)).toThrow();
    });

    test('should reject wrong type for normalized field', () => {
      const invalidData = {
        valid: true,
        normalized: 123, // number instead of string
      };

      expect(() => TagValidationResultSchema.parse(invalidData)).toThrow();
    });

    test('should reject wrong type for suggestion field', () => {
      const invalidData = {
        valid: true,
        normalized: 'test-tag',
        suggestion: 123, // number instead of string
      };

      expect(() => TagValidationResultSchema.parse(invalidData)).toThrow();
    });

    test('should use safeParse and return error details for invalid data', () => {
      const invalidData = {
        valid: 'not-a-boolean',
        normalized: 'test-tag',
      };

      const result = TagValidationResultSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues[0].path).toContain('valid');
      }
    });

    test('should provide clear error message for missing required fields', () => {
      const invalidData = {};

      const result = TagValidationResultSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBe(2); // valid and normalized are required
        const paths = result.error.issues.map((issue) => issue.path[0]);
        expect(paths).toContain('valid');
        expect(paths).toContain('normalized');
      }
    });
  });

  describe('type inference', () => {
    test('should infer correct TypeScript type', () => {
      // This test verifies that the inferred type is correct at compile time
      const validResult: ReturnType<typeof TagValidationResultSchema.parse> = {
        valid: true,
        normalized: 'test-tag',
        suggestion: 'optional-suggestion',
      };

      expect(validResult.valid).toBe(true);
      expect(validResult.normalized).toBe('test-tag');
      expect(validResult.suggestion).toBe('optional-suggestion');
    });
  });

  describe('edge cases', () => {
    test('should handle empty string for normalized field', () => {
      const data = {
        valid: false,
        normalized: '',
      };

      const result = TagValidationResultSchema.parse(data);

      expect(result.normalized).toBe('');
    });

    test('should handle empty string for optional suggestion', () => {
      const data = {
        valid: false,
        normalized: 'test',
        suggestion: '',
      };

      const result = TagValidationResultSchema.parse(data);

      expect(result.suggestion).toBe('');
    });

    test('should reject null values', () => {
      const invalidData = {
        valid: null,
        normalized: 'test-tag',
      };

      expect(() => TagValidationResultSchema.parse(invalidData)).toThrow();
    });

    test('should reject undefined for required fields', () => {
      const invalidData = {
        valid: undefined,
        normalized: 'test-tag',
      };

      expect(() => TagValidationResultSchema.parse(invalidData)).toThrow();
    });
  });
});
