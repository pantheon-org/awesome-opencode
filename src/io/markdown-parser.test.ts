import { describe, test, expect } from 'bun:test';
import {
  parseMarkdown,
  generateMarkdown,
  extractFrontmatter,
  type FrontmatterData,
} from './markdown-parser';

describe('markdown-parser', () => {
  describe('parseMarkdown', () => {
    test('should parse markdown with frontmatter', () => {
      const content = `---
title: Test Document
author: John Doe
---
# Content
This is the content.`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.title).toBe('Test Document');
      expect(result.frontmatter.author).toBe('John Doe');
      expect(result.content).toContain('# Content');
      expect(result.content).toContain('This is the content.');
    });

    test('should parse markdown without frontmatter', () => {
      const content = '# Markdown Content\nThis is just markdown.';

      const result = parseMarkdown(content);

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe(content);
    });

    test('should handle empty frontmatter', () => {
      const content = `---
---
Content here`;

      const result = parseMarkdown(content);

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe('Content here');
    });

    test('should parse frontmatter with arrays', () => {
      const content = `---
title: Test
tags:
  - tag1
  - tag2
  - tag3
---
Content`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.title).toBe('Test');
      expect(Array.isArray(result.frontmatter.tags)).toBe(true);
      expect((result.frontmatter.tags as string[]).length).toBe(3);
      expect((result.frontmatter.tags as string[])[0]).toBe('tag1');
    });

    test('should parse frontmatter with inline arrays', () => {
      const content = `---
title: Test
tags: [tag1, tag2, tag3]
---
Content`;

      const result = parseMarkdown(content);

      expect(Array.isArray(result.frontmatter.tags)).toBe(true);
      expect((result.frontmatter.tags as string[]).length).toBe(3);
    });

    test('should parse frontmatter with numbers', () => {
      const content = `---
count: 42
rating: 4.5
---
Content`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.count).toBe(42);
      expect(result.frontmatter.rating).toBe(4.5);
    });

    test('should parse frontmatter with booleans', () => {
      const content = `---
published: true
draft: false
---
Content`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.published).toBe(true);
      expect(result.frontmatter.draft).toBe(false);
    });

    test('should parse frontmatter with null values', () => {
      const content = `---
title: Test
description: null
---
Content`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.title).toBe('Test');
      expect(result.frontmatter.description).toBe(null);
    });

    test('should handle quoted strings in frontmatter', () => {
      const content = `---
title: "Hello: World"
message: 'This has # special chars'
---
Content`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.title).toBe('Hello: World');
      expect(result.frontmatter.message).toBe('This has # special chars');
    });

    test('should handle empty content', () => {
      const result = parseMarkdown('');

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe('');
    });

    test('should handle multiline content after frontmatter', () => {
      const content = `---
title: Test
---
# Section 1
Content 1

# Section 2
Content 2`;

      const result = parseMarkdown(content);

      expect(result.content).toContain('# Section 1');
      expect(result.content).toContain('# Section 2');
      expect(result.content).toContain('Content 1');
      expect(result.content).toContain('Content 2');
    });

    test('should parse mixed type arrays', () => {
      const content = `---
mixed:
  - string
  - 123
  - true
---
Content`;

      const result = parseMarkdown(content);

      expect(Array.isArray(result.frontmatter.mixed)).toBe(true);
      const mixed = result.frontmatter.mixed as (string | number | boolean)[];
      expect(mixed[0]).toBe('string');
      expect(mixed[1]).toBe(123);
      expect(mixed[2]).toBe(true);
    });

    test('should handle comments in frontmatter', () => {
      const content = `---
title: Test
# This is a comment
author: Jane
---
Content`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.title).toBe('Test');
      expect(result.frontmatter.author).toBe('Jane');
      expect(Object.keys(result.frontmatter).length).toBe(2);
    });

    test('should respect strict mode', () => {
      const content = `---
title: Test
---
Content`;

      expect(() => {
        parseMarkdown(content, { strict: true });
      }).not.toThrow();
    });
  });

  describe('generateMarkdown', () => {
    test('should generate markdown with simple frontmatter', () => {
      const frontmatter: FrontmatterData = {
        title: 'Test',
        author: 'John',
      };
      const content = '# Content';

      const result = generateMarkdown(frontmatter, content);

      expect(result).toContain('---');
      expect(result).toContain('title: Test');
      expect(result).toContain('author: John');
      expect(result).toContain('# Content');
    });

    test('should generate markdown with array values', () => {
      const frontmatter: FrontmatterData = {
        title: 'Test',
        tags: ['tag1', 'tag2', 'tag3'],
      };
      const content = 'Content';

      const result = generateMarkdown(frontmatter, content);

      expect(result).toContain('tags:');
      expect(result).toContain('- tag1');
      expect(result).toContain('- tag2');
      expect(result).toContain('- tag3');
    });

    test('should generate markdown with empty frontmatter', () => {
      const frontmatter: FrontmatterData = {};
      const content = '# Content';

      const result = generateMarkdown(frontmatter, content);

      expect(result).toBe('# Content');
    });

    test('should properly format special characters', () => {
      const frontmatter: FrontmatterData = {
        title: 'Hello: World',
      };
      const content = 'Content';

      const result = generateMarkdown(frontmatter, content);

      expect(result).toContain('"Hello: World"');
    });

    test('should handle boolean values', () => {
      const frontmatter: FrontmatterData = {
        published: true,
        draft: false,
      };
      const content = 'Content';

      const result = generateMarkdown(frontmatter, content);

      expect(result).toContain('published: true');
      expect(result).toContain('draft: false');
    });

    test('should round-trip: generate then parse', () => {
      const original: FrontmatterData = {
        title: 'Test',
        count: 42,
        tags: ['tag1', 'tag2'],
        published: true,
      };
      const content = '# Content';

      const markdown = generateMarkdown(original, content);
      const parsed = parseMarkdown(markdown);

      expect(parsed.frontmatter.title).toBe(original.title);
      expect(parsed.frontmatter.count).toBe(original.count);
      expect(parsed.frontmatter.published).toBe(original.published);
      expect(Array.isArray(parsed.frontmatter.tags)).toBe(true);
    });
  });

  describe('extractFrontmatter', () => {
    test('should extract frontmatter from markdown', () => {
      const content = `---
title: Test
author: John
---
Content`;

      const frontmatter = extractFrontmatter(content);

      expect(frontmatter.title).toBe('Test');
      expect(frontmatter.author).toBe('John');
    });

    test('should return empty object when no frontmatter', () => {
      const content = '# Just markdown\nNo frontmatter here';

      const frontmatter = extractFrontmatter(content);

      expect(frontmatter).toEqual({});
    });

    test('should handle empty content', () => {
      const frontmatter = extractFrontmatter('');

      expect(frontmatter).toEqual({});
    });

    test('should extract complex frontmatter', () => {
      const content = `---
title: Complex Document
author: Jane Doe
date: 2024-01-01
tags:
  - important
  - review
published: true
---
## Content`;

      const frontmatter = extractFrontmatter(content);

      expect(frontmatter.title).toBe('Complex Document');
      expect(frontmatter.author).toBe('Jane Doe');
      expect(frontmatter.date).toBe('2024-01-01');
      expect(Array.isArray(frontmatter.tags)).toBe(true);
      expect(frontmatter.published).toBe(true);
    });

    test('should handle frontmatter with special characters', () => {
      const content = `---
title: "Hello: World"
description: "Test # with symbols"
---
Content`;

      const frontmatter = extractFrontmatter(content);

      expect(frontmatter.title).toBe('Hello: World');
      expect(frontmatter.description).toBe('Test # with symbols');
    });
  });

  describe('edge cases', () => {
    test('should handle markdown with --- in content', () => {
      const content = `---
title: Test
---
---
This is a code block with dashes
---`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.title).toBe('Test');
      expect(result.content).toContain('---');
    });

    test('should handle very long frontmatter', () => {
      let frontmatterContent = '';
      for (let i = 0; i < 100; i++) {
        frontmatterContent += `key${i}: value${i}\n`;
      }
      const content = `---\n${frontmatterContent}---\nContent`;

      const result = parseMarkdown(content);

      expect(Object.keys(result.frontmatter).length).toBeGreaterThan(0);
      expect(result.content).toBe('Content');
    });

    test('should handle unicode characters', () => {
      const content = `---
title: 你好世界
author: José García
emoji: 🎉
---
Content with emoji 🌟`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.title).toBe('你好世界');
      expect(result.frontmatter.author).toBe('José García');
      expect(result.frontmatter.emoji).toBe('🎉');
    });

    test('should handle empty arrays', () => {
      const content = `---
title: Test
tags: []
---
Content`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.tags).toEqual([]);
    });

    test('should handle null in arrays', () => {
      const content = `---
title: Test
items:
  - item1
  - null
  - item3
---
Content`;

      const result = parseMarkdown(content);

      expect(Array.isArray(result.frontmatter.items)).toBe(true);
      const items = result.frontmatter.items as (string | null)[];
      expect(items[1]).toBe(null);
    });

    test('should handle whitespace edge cases', () => {
      const content = `---
title:    Test with spaces
author: "  Quoted with spaces  "
---
Content`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.title).toBe('Test with spaces');
      expect(result.frontmatter.author).toBe('  Quoted with spaces  ');
    });
  });

  describe('round-trip tests', () => {
    test('should preserve data through parse-generate cycle', () => {
      const original = `---
title: Complete Document
author: Test Author
version: 1.0
tags:
  - tag1
  - tag2
published: true
---
# Main Content

This is the main content of the document.`;

      const parsed = parseMarkdown(original);
      const regenerated = generateMarkdown(parsed.frontmatter, parsed.content);
      const reparsed = parseMarkdown(regenerated);

      expect(reparsed.frontmatter.title).toBe(parsed.frontmatter.title);
      expect(reparsed.frontmatter.author).toBe(parsed.frontmatter.author);
      expect(reparsed.frontmatter.version).toBe(parsed.frontmatter.version);
      expect(reparsed.frontmatter.published).toBe(parsed.frontmatter.published);
    });
  });
});
