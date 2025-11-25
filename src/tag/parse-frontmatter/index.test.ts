import { describe, expect, test } from 'bun:test';
import { parseFrontmatter } from './index';

describe('parseFrontmatter', () => {
  test('should return empty object when no frontmatter exists', () => {
    const content = 'No frontmatter here';
    const result = parseFrontmatter(content);
    expect(result).toEqual({});
  });

  test('should parse simple key-value pairs', () => {
    const content = `---
title: Test Title
author: John Doe
---`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({
      title: 'Test Title',
      author: 'John Doe',
    });
  });

  test('should parse array values', () => {
    const content = `---
tags:
- javascript
- typescript
- testing
---`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({
      tags: ['javascript', 'typescript', 'testing'],
    });
  });

  test('should handle mixed simple and array values', () => {
    const content = `---
title: Test Tool
category: testing
tags:
- bun
- typescript
repository: https://github.com/test/repo
---`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({
      title: 'Test Tool',
      category: 'testing',
      tags: ['bun', 'typescript'],
      repository: 'https://github.com/test/repo',
    });
  });

  test('should handle empty arrays', () => {
    const content = `---
title: Test
tags:
---`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({
      title: 'Test',
      tags: [],
    });
  });

  test('should handle quoted values', () => {
    const content = `---
title: "Quoted Title"
author: 'Single Quoted'
---`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({
      title: 'Quoted Title',
      author: 'Single Quoted',
    });
  });

  test('should handle values with colons', () => {
    const content = `---
url: https://example.com:8080/path
---`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({
      url: 'https://example.com:8080/path',
    });
  });
});
