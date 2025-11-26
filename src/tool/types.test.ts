import { describe, expect, test } from 'bun:test';
import {
  ToolThemesSchema,
  ToolMetadataSchema,
  ToolFrontmatterSchema,
  ToolInfoSchema,
} from './types';

describe('ToolThemesSchema', () => {
  test('should parse valid ToolThemes', () => {
    const validData = {
      primary: 'ai-powered-development',
      secondary: ['code-quality', 'developer-productivity'],
    };

    const result = ToolThemesSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should parse ToolThemes with empty secondary array', () => {
    const validData = {
      primary: 'testing-tools',
      secondary: [],
    };

    const result = ToolThemesSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should reject missing primary field', () => {
    const invalidData = {
      secondary: ['theme1'],
    };

    expect(() => ToolThemesSchema.parse(invalidData)).toThrow();
  });

  test('should reject missing secondary field', () => {
    const invalidData = {
      primary: 'main-theme',
    };

    expect(() => ToolThemesSchema.parse(invalidData)).toThrow();
  });

  test('should reject non-array secondary field', () => {
    const invalidData = {
      primary: 'main-theme',
      secondary: 'not-an-array',
    };

    expect(() => ToolThemesSchema.parse(invalidData)).toThrow();
  });
});

describe('ToolMetadataSchema', () => {
  test('should parse valid ToolMetadata', () => {
    const validData = {
      tool_name: 'OpenCode',
      category: 'ai-coding-assistants',
      themes: {
        primary: 'ai-powered-development',
        secondary: ['developer-productivity'],
      },
      tags: ['ai', 'coding', 'assistant'],
      repository: 'https://github.com/example/opencode',
    };

    const result = ToolMetadataSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should reject missing required fields', () => {
    const invalidData = {
      tool_name: 'OpenCode',
      category: 'ai-coding-assistants',
    };

    expect(() => ToolMetadataSchema.parse(invalidData)).toThrow();
  });

  test('should reject invalid themes structure', () => {
    const invalidData = {
      tool_name: 'OpenCode',
      category: 'ai-coding-assistants',
      themes: 'invalid-themes',
      tags: ['ai'],
      repository: 'https://github.com/example/opencode',
    };

    expect(() => ToolMetadataSchema.parse(invalidData)).toThrow();
  });

  test('should reject non-array tags', () => {
    const invalidData = {
      tool_name: 'OpenCode',
      category: 'ai-coding-assistants',
      themes: {
        primary: 'ai-powered-development',
        secondary: [],
      },
      tags: 'not-an-array',
      repository: 'https://github.com/example/opencode',
    };

    expect(() => ToolMetadataSchema.parse(invalidData)).toThrow();
  });
});

describe('ToolFrontmatterSchema', () => {
  test('should parse valid ToolFrontmatter with all fields', () => {
    const validData = {
      tool_name: 'OpenCode',
      repository: 'https://github.com/example/opencode',
      category: 'ai-coding-assistants',
      themes: ['ai-powered-development', 'developer-productivity'],
      tags: ['ai', 'coding'],
      submitted_date: '2025-11-26',
    };

    const result = ToolFrontmatterSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should parse valid ToolFrontmatter without optional submitted_date', () => {
    const validData = {
      tool_name: 'OpenCode',
      repository: 'https://github.com/example/opencode',
      category: 'ai-coding-assistants',
      themes: ['ai-powered-development'],
      tags: ['ai'],
    };

    const result = ToolFrontmatterSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should reject missing required fields', () => {
    const invalidData = {
      tool_name: 'OpenCode',
      repository: 'https://github.com/example/opencode',
    };

    expect(() => ToolFrontmatterSchema.parse(invalidData)).toThrow();
  });

  test('should handle empty arrays', () => {
    const validData = {
      tool_name: 'OpenCode',
      repository: 'https://github.com/example/opencode',
      category: 'ai-coding-assistants',
      themes: [],
      tags: [],
    };

    const result = ToolFrontmatterSchema.parse(validData);

    expect(result).toEqual(validData);
  });
});

describe('ToolInfoSchema', () => {
  test('should parse valid ToolInfo with all fields', () => {
    const validData = {
      tool_name: 'OpenCode',
      repository: 'https://github.com/example/opencode',
      category: 'ai-coding-assistants',
      themes: ['ai-powered-development'],
      tags: ['ai', 'coding'],
      submitted_date: '2025-11-26',
      filename: 'opencode.md',
      description: 'An AI-powered coding assistant',
    };

    const result = ToolInfoSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should parse valid ToolInfo without optional submitted_date', () => {
    const validData = {
      tool_name: 'OpenCode',
      repository: 'https://github.com/example/opencode',
      category: 'ai-coding-assistants',
      themes: ['ai-powered-development'],
      tags: ['ai'],
      filename: 'opencode.md',
      description: 'An AI-powered coding assistant',
    };

    const result = ToolInfoSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  test('should reject missing filename', () => {
    const invalidData = {
      tool_name: 'OpenCode',
      repository: 'https://github.com/example/opencode',
      category: 'ai-coding-assistants',
      themes: ['ai-powered-development'],
      tags: ['ai'],
      description: 'An AI-powered coding assistant',
    };

    expect(() => ToolInfoSchema.parse(invalidData)).toThrow();
  });

  test('should reject missing description', () => {
    const invalidData = {
      tool_name: 'OpenCode',
      repository: 'https://github.com/example/opencode',
      category: 'ai-coding-assistants',
      themes: ['ai-powered-development'],
      tags: ['ai'],
      filename: 'opencode.md',
    };

    expect(() => ToolInfoSchema.parse(invalidData)).toThrow();
  });
});

describe('Schema validation edge cases', () => {
  test('should provide clear error messages with safeParse', () => {
    const invalidData = {
      tool_name: 'OpenCode',
      // missing required fields
    };

    const result = ToolFrontmatterSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  test('should validate nested themes in ToolMetadata', () => {
    const invalidData = {
      tool_name: 'OpenCode',
      category: 'ai-coding-assistants',
      themes: {
        primary: 'ai-powered-development',
        secondary: ['valid-theme', 123], // Invalid: number in array
      },
      tags: ['ai'],
      repository: 'https://github.com/example/opencode',
    };

    expect(() => ToolMetadataSchema.parse(invalidData)).toThrow();
  });

  test('should handle empty strings', () => {
    const dataWithEmptyStrings = {
      tool_name: '',
      repository: '',
      category: '',
      themes: [''],
      tags: [''],
      filename: '',
      description: '',
    };

    // Should parse successfully (strings can be empty unless we add constraints)
    const result = ToolInfoSchema.parse(dataWithEmptyStrings);
    expect(result.tool_name).toBe('');
  });
});
