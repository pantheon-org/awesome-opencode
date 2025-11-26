# Zod Migration Guide

**Last Updated:** 2025-11-26

## Overview

This guide documents the migration of TypeScript interfaces to Zod schemas across the awesome-opencode codebase. This migration enables runtime type validation while maintaining 100% backward compatibility with existing code.

## Table of Contents

- [Why Zod?](#why-zod)
- [Migration Summary](#migration-summary)
- [Using Zod Schemas](#using-zod-schemas)
- [Migration Examples](#migration-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Why Zod?

### Benefits

1. **Runtime Type Safety**: Validate data at runtime, not just compile-time
2. **Better Error Messages**: Zod provides detailed validation errors for debugging
3. **Single Source of Truth**: Define schema once, get TypeScript types automatically via `z.infer`
4. **API/File Validation**: Validate external data from JSON files, API responses, user input
5. **Self-Documenting**: Schemas include descriptions that serve as documentation

### Use Cases

- Loading and validating JSON configuration files
- Validating user input from GitHub issues/PRs
- Ensuring data integrity before processing
- Providing clear error messages when data is invalid

## Migration Summary

All TypeScript interfaces have been converted to Zod schemas with full backward compatibility:

| File                           | Types Converted | Tests Added | Status      |
| ------------------------------ | --------------- | ----------- | ----------- |
| `src/tag/types.ts`             | 1               | 15          | ✅ Complete |
| `src/tool/types.ts`            | 4               | 20          | ✅ Complete |
| `src/category/types.ts`        | 2               | 13          | ✅ Complete |
| `src/theme/types.ts`           | 5               | -           | ✅ Complete |
| `src/generate-report/types.ts` | 1               | -           | ✅ Complete |
| `src/security/types.ts`        | 15              | 33          | ✅ Complete |

**Total:** 28+ types converted, 81+ validation tests added, 341 total tests passing

## Using Zod Schemas

### Basic Usage

```typescript
import { CategorySchema } from './category/types';

// Parse and validate data (throws on error)
const category = CategorySchema.parse({
  slug: 'ai-coding-assistants',
  title: 'AI Coding Assistants',
  description: 'AI-powered tools that help with coding',
});

// Safe parse (returns result object)
const result = CategorySchema.safeParse(unknownData);

if (result.success) {
  // Data is valid
  console.log(result.data);
} else {
  // Data is invalid
  console.error(result.error.issues);
}
```

### Type Inference

All types are now inferred from Zod schemas:

```typescript
import { Category, CategorySchema } from './category/types';

// TypeScript type is inferred from schema
type Category = z.infer<typeof CategorySchema>;

// Both are equivalent and type-safe
const category1: Category = {
  /* ... */
};
const category2 = CategorySchema.parse({
  /* ... */
});
```

### Validating JSON Files

```typescript
import { readFileSync } from 'fs';
import { CategoriesConfigSchema } from './category/types';

try {
  const content = readFileSync('data/categories.json', 'utf-8');
  const data = JSON.parse(content);

  // Validate the loaded data
  const config = CategoriesConfigSchema.parse(data);

  // config is now type-safe and validated
  console.log(`Loaded ${config.categories.length} categories`);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Invalid categories.json:', error.issues);
  }
}
```

## Migration Examples

### Example 1: Simple Interface

**Before:**

```typescript
export interface TagValidationResult {
  valid: boolean;
  normalized: string;
  suggestion?: string;
}
```

**After:**

```typescript
import { z } from 'zod';

export const TagValidationResultSchema = z.object({
  valid: z.boolean().describe('Whether the tag is valid'),
  normalized: z.string().describe('The normalized version of the tag'),
  suggestion: z.string().optional().describe('Optional suggestion for invalid tags'),
});

export type TagValidationResult = z.infer<typeof TagValidationResultSchema>;
```

**Usage:**

```typescript
// Old way (compile-time only)
const result: TagValidationResult = {
  valid: true,
  normalized: 'test-tag',
};

// New way (runtime validation)
const result = TagValidationResultSchema.parse({
  valid: true,
  normalized: 'test-tag',
});

// Invalid data will throw
try {
  TagValidationResultSchema.parse({
    valid: 'not-a-boolean', // Error!
    normalized: 'test-tag',
  });
} catch (error) {
  console.error('Validation failed:', error);
}
```

### Example 2: Nested Objects

**Before:**

```typescript
export interface ToolMetadata {
  tool_name: string;
  category: string;
  themes: {
    primary: string;
    secondary: string[];
  };
  tags: string[];
  repository: string;
}
```

**After:**

```typescript
import { z } from 'zod';

const ToolThemesSchema = z.object({
  primary: z.string().describe('The primary theme for the tool'),
  secondary: z.array(z.string()).describe('Secondary themes'),
});

export const ToolMetadataSchema = z.object({
  tool_name: z.string().describe('The name of the tool'),
  category: z.string().describe('The category of the tool'),
  themes: ToolThemesSchema.describe('Theme information'),
  tags: z.array(z.string()).describe('Tags associated with the tool'),
  repository: z.string().describe('The repository URL'),
});

export type ToolMetadata = z.infer<typeof ToolMetadataSchema>;
```

### Example 3: Enums and Unions

**Before:**

```typescript
export type ThemeStatus = 'active' | 'under_review' | 'archived';
export type WorkflowType = 'triage' | 'categorize' | 'validate';
```

**After:**

```typescript
import { z } from 'zod';

export const ThemeStatusSchema = z.enum(['active', 'under_review', 'archived']);
export type ThemeStatus = z.infer<typeof ThemeStatusSchema>;

export const WorkflowTypeSchema = z.enum(['triage', 'categorize', 'validate']);
export type WorkflowType = z.infer<typeof WorkflowTypeSchema>;
```

**Usage:**

```typescript
// Validate enum values
const status = ThemeStatusSchema.parse('active'); // OK
const invalid = ThemeStatusSchema.parse('deleted'); // Throws error

// Get all valid enum values
const validStatuses = ThemeStatusSchema.options; // ['active', 'under_review', 'archived']
```

### Example 4: Complex Security Configuration

**Before:**

```typescript
export interface SecurityConfig {
  rateLimits: {
    perUser: RateLimitConfig;
    perRepo: RateLimitConfig;
  };
  alerting: AlertConfig;
  logging: LogConfig;
}
```

**After:**

```typescript
export const SecurityConfigSchema = z.object({
  rateLimits: z
    .object({
      perUser: RateLimitConfigSchema.describe('Per-user rate limits'),
      perRepo: RateLimitConfigSchema.describe('Per-repository rate limits'),
    })
    .describe('Rate limiting configuration'),
  alerting: AlertConfigSchema.describe('Alerting configuration'),
  logging: LogConfigSchema.describe('Logging configuration'),
});

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
```

**Usage:**

```typescript
import { SecurityConfigSchema } from './security/types';

// Load and validate security config
function loadSecurityConfig(path: string): SecurityConfig {
  const content = readFileSync(path, 'utf-8');
  const data = JSON.parse(content);

  // Validate with detailed error messages
  const result = SecurityConfigSchema.safeParse(data);

  if (!result.success) {
    console.error('Invalid security configuration:');
    result.error.issues.forEach((issue) => {
      console.error(`- ${issue.path.join('.')}: ${issue.message}`);
    });
    throw new Error('Configuration validation failed');
  }

  return result.data;
}
```

## Best Practices

### 1. Always Use Runtime Validation for External Data

```typescript
// ❌ BAD - No runtime validation
const categories = JSON.parse(fs.readFileSync('data/categories.json', 'utf-8'));

// ✅ GOOD - Runtime validation
const data = JSON.parse(fs.readFileSync('data/categories.json', 'utf-8'));
const categories = CategoriesConfigSchema.parse(data);
```

### 2. Use `.safeParse()` When Errors are Expected

```typescript
// ❌ BAD - Throws exception
try {
  const result = UserInputSchema.parse(userInput);
} catch (error) {
  // Handle error
}

// ✅ GOOD - Returns result object
const result = UserInputSchema.safeParse(userInput);
if (!result.success) {
  // Handle validation errors gracefully
  return { error: result.error.issues };
}
```

### 3. Add Descriptions to All Schema Fields

```typescript
// ❌ BAD - No descriptions
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// ✅ GOOD - Clear descriptions
const UserSchema = z.object({
  name: z.string().describe("The user's full name"),
  age: z.number().int().positive().describe("The user's age in years"),
});
```

### 4. Use Specific Constraints

```typescript
// ❌ BAD - Too permissive
const ConfigSchema = z.object({
  maxAttempts: z.number(),
  percentage: z.number(),
});

// ✅ GOOD - Specific constraints
const ConfigSchema = z.object({
  maxAttempts: z.number().int().positive().describe('Maximum attempts allowed'),
  percentage: z.number().min(0).max(100).describe('Percentage value (0-100)'),
});
```

### 5. Provide Clear Error Messages

```typescript
function validateAndLoad<T>(schema: z.ZodSchema<T>, data: unknown, source: string): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error(`Validation failed for ${source}:`);
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    throw new Error(`Invalid ${source}`);
  }

  return result.data;
}
```

## Troubleshooting

### Issue: Type Mismatch After Migration

**Problem:** Existing code shows TypeScript errors after migration.

**Solution:** The migrated types are 100% compatible. If you see errors:

1. Check that you're importing from the correct location
2. Ensure you're using `z.infer<typeof Schema>` for type definitions
3. Run `bun run typecheck` to see specific errors

### Issue: Validation Failing on Valid Data

**Problem:** `parse()` throws errors on data that should be valid.

**Solution:**

1. Use `.safeParse()` to see detailed error messages
2. Check for missing required fields
3. Verify data types match the schema (e.g., strings vs numbers)
4. Look at the test files for examples of valid data

```typescript
const result = MySchema.safeParse(data);
if (!result.success) {
  console.log('Validation errors:', result.error.issues);
}
```

### Issue: Performance Concerns

**Problem:** Worried about validation overhead.

**Solution:**

- Zod validation is typically <5ms per operation
- Only validate at boundaries (file loads, API calls, user input)
- Don't validate internal function calls where types are already known
- Use `.parse()` in development, consider caching validated data in production

### Issue: Optional Fields Not Working

**Problem:** Optional fields are still required.

**Solution:** Use `.optional()` on the field, not the type:

```typescript
// ❌ BAD
const Schema = z.object({
  name: z.string(),
  age: z.number(), // This is required
});

// ✅ GOOD
const Schema = z.object({
  name: z.string(),
  age: z.number().optional(), // This is optional
});
```

## Testing Your Schemas

Every schema should have tests. See examples in:

- `src/tag/types.test.ts` (15 tests)
- `src/tool/types.test.ts` (20 tests)
- `src/category/types.test.ts` (13 tests)
- `src/security/types.test.ts` (33 tests)

**Basic test template:**

```typescript
import { describe, expect, test } from 'bun:test';
import { MySchema } from './types';

describe('MySchema', () => {
  test('should parse valid data', () => {
    const validData = {
      // ... valid fields
    };

    const result = MySchema.parse(validData);
    expect(result).toEqual(validData);
  });

  test('should reject invalid data', () => {
    const invalidData = {
      // ... missing or invalid fields
    };

    expect(() => MySchema.parse(invalidData)).toThrow();
  });

  test('should provide clear error messages', () => {
    const invalidData = {
      /* ... */
    };

    const result = MySchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
```

## Additional Resources

- [Zod Documentation](https://zod.dev/)
- [Zod GitHub Repository](https://github.com/colinhacks/zod)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Questions?

If you have questions about the Zod migration:

1. Check the test files for usage examples
2. Review existing schema definitions in `src/*/types.ts`
3. Open an issue on GitHub for clarification

---

**Migration completed:** 2025-11-26  
**Zod version:** 4.1.13  
**Tests added:** 81+  
**Total tests:** 341  
**Backward compatibility:** 100%
