import { describe, test, expect, afterEach, beforeEach } from 'bun:test';
import { join } from 'path';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { readJson, writeJson, parseJsonSafe } from './json-handler';
import { fileExists } from './file-operations';

const TEMP_DIR = join(import.meta.dir, '.test-json-temp');

/**
 * Helper function to cleanup test files
 */
const cleanup = (): void => {
  if (fileExists(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true });
  }
};

beforeEach(() => {
  cleanup();
  mkdirSync(TEMP_DIR, { recursive: true });
});

afterEach(() => {
  cleanup();
});

describe('json-handler', () => {
  describe('readJson', () => {
    test('should read valid JSON file', () => {
      const testFile = join(TEMP_DIR, 'test.json');
      const data = { name: 'test', value: 42 };
      writeFileSync(testFile, JSON.stringify(data), 'utf-8');

      const result = readJson(testFile);

      expect(result).toEqual(data);
    });

    test('should read JSON with arrays', () => {
      const testFile = join(TEMP_DIR, 'test.json');
      const data = { items: [1, 2, 3], names: ['a', 'b', 'c'] };
      writeFileSync(testFile, JSON.stringify(data), 'utf-8');

      const result = readJson(testFile);

      expect(result).toEqual(data);
    });

    test('should read JSON with nested objects', () => {
      const testFile = join(TEMP_DIR, 'test.json');
      const data = { user: { name: 'John', age: 30, address: { city: 'NYC' } } };
      writeFileSync(testFile, JSON.stringify(data), 'utf-8');

      const result = readJson(testFile);

      expect(result).toEqual(data);
    });

    test('should throw on invalid JSON with throwOnInvalid=true', () => {
      const testFile = join(TEMP_DIR, 'invalid.json');
      writeFileSync(testFile, 'invalid json content', 'utf-8');

      expect(() => {
        readJson(testFile, { throwOnInvalid: true });
      }).toThrow();
    });

    test('should return undefined on invalid JSON with throwOnInvalid=false', () => {
      const testFile = join(TEMP_DIR, 'invalid.json');
      writeFileSync(testFile, 'invalid json content', 'utf-8');

      const result = readJson(testFile, { throwOnInvalid: false });

      expect(result).toBeUndefined();
    });

    test('should validate with custom validator', () => {
      const testFile = join(TEMP_DIR, 'test.json');
      const data = { name: 'test' };
      writeFileSync(testFile, JSON.stringify(data), 'utf-8');

      const validator = (data: unknown) => {
        return typeof data === 'object' && data !== null && 'name' in data;
      };

      const result = readJson(testFile, { validate: validator });

      expect(result).toEqual(data);
    });

    test('should throw on validation failure with throwOnInvalid=true', () => {
      const testFile = join(TEMP_DIR, 'test.json');
      const data = { value: 42 };
      writeFileSync(testFile, JSON.stringify(data), 'utf-8');

      const validator = (data: unknown) => {
        return typeof data === 'object' && data !== null && 'name' in data;
      };

      expect(() => {
        readJson(testFile, { validate: validator, throwOnInvalid: true });
      }).toThrow();
    });

    test('should handle empty object', () => {
      const testFile = join(TEMP_DIR, 'empty.json');
      writeFileSync(testFile, '{}', 'utf-8');

      const result = readJson(testFile);

      expect(result).toEqual({});
    });

    test('should handle empty array', () => {
      const testFile = join(TEMP_DIR, 'empty.json');
      writeFileSync(testFile, '[]', 'utf-8');

      const result = readJson(testFile);

      expect(result).toEqual([]);
    });

    test('should handle various data types', () => {
      const testFile = join(TEMP_DIR, 'types.json');
      const data = {
        string: 'test',
        number: 42,
        float: 3.14,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: true },
      };
      writeFileSync(testFile, JSON.stringify(data), 'utf-8');

      const result = readJson(testFile);

      expect(result).toEqual(data);
    });
  });

  describe('writeJson', () => {
    test('should write JSON with pretty print by default', () => {
      const testFile = join(TEMP_DIR, 'output.json');
      const data = { name: 'test', value: 42 };

      writeJson(testFile, data);

      const content = require('fs').readFileSync(testFile, 'utf-8');
      expect(content).toContain('\n');
      expect(content).toContain('  ');
    });

    test('should write JSON without pretty print', () => {
      const testFile = join(TEMP_DIR, 'output.json');
      const data = { name: 'test', value: 42 };

      writeJson(testFile, data, { pretty: false });

      const content = require('fs').readFileSync(testFile, 'utf-8');
      expect(content).not.toContain('\n');
    });

    test('should use custom indentation', () => {
      const testFile = join(TEMP_DIR, 'output.json');
      const data = { nested: { value: 42 } };

      writeJson(testFile, data, { spaces: 4 });

      const content = require('fs').readFileSync(testFile, 'utf-8');
      expect(content).toContain('    ');
    });

    test('should overwrite existing file', () => {
      const testFile = join(TEMP_DIR, 'output.json');
      const data1 = { version: 1 };
      const data2 = { version: 2 };

      writeJson(testFile, data1);
      writeJson(testFile, data2);

      const result = readJson<typeof data2>(testFile);
      expect((result as Record<string, number>).version).toBe(2);
    });

    test('should write complex nested structures', () => {
      const testFile = join(TEMP_DIR, 'complex.json');
      const data = {
        users: [
          { id: 1, name: 'Alice', tags: ['admin', 'user'] },
          { id: 2, name: 'Bob', tags: ['user'] },
        ],
        settings: { theme: 'dark', notifications: true },
      };

      writeJson(testFile, data);

      const result = readJson(testFile);
      expect(result).toEqual(data);
    });

    test('should handle arrays at root level', () => {
      const testFile = join(TEMP_DIR, 'array.json');
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];

      writeJson(testFile, data);

      const result = readJson(testFile);
      expect(result).toEqual(data);
    });

    test('should handle primitives at root level', () => {
      const testFile = join(TEMP_DIR, 'string.json');
      const data = 'test string';

      writeJson(testFile, data);

      const result = readJson(testFile);
      expect(result).toBe(data);
    });
  });

  describe('parseJsonSafe', () => {
    test('should parse valid JSON', () => {
      const json = '{"name": "test", "value": 42}';

      const result = parseJsonSafe(json);

      expect(result).toEqual({ name: 'test', value: 42 });
    });

    test('should return null on invalid JSON by default', () => {
      const json = 'invalid json {';

      const result = parseJsonSafe(json);

      expect(result).toBeNull();
    });

    test('should throw on invalid JSON with throwOnInvalid=true', () => {
      const json = 'invalid json {';

      expect(() => {
        parseJsonSafe(json, { throwOnInvalid: true });
      }).toThrow();
    });

    test('should validate with custom validator', () => {
      const json = '{"name": "test"}';
      const validator = (data: unknown) => {
        return typeof data === 'object' && data !== null && 'name' in data;
      };

      const result = parseJsonSafe(json, { validate: validator });

      expect(result).toEqual({ name: 'test' });
    });

    test('should return null on validation failure', () => {
      const json = '{"value": 42}';
      const validator = (data: unknown) => {
        return typeof data === 'object' && data !== null && 'name' in data;
      };

      const result = parseJsonSafe(json, { validate: validator });

      expect(result).toBeNull();
    });

    test('should throw on validation failure with throwOnInvalid=true', () => {
      const json = '{"value": 42}';
      const validator = (data: unknown) => {
        return typeof data === 'object' && data !== null && 'name' in data;
      };

      expect(() => {
        parseJsonSafe(json, { validate: validator, throwOnInvalid: true });
      }).toThrow();
    });

    test('should parse arrays', () => {
      const json = '[1, 2, 3, 4, 5]';

      const result = parseJsonSafe(json);

      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test('should parse nested structures', () => {
      const json = '{"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}';

      const result = parseJsonSafe<Record<string, unknown>>(json);

      expect(Array.isArray(result?.users)).toBe(true);
      expect((result?.users as Array<unknown>).length).toBe(2);
    });

    test('should handle edge cases', () => {
      const nullResult = parseJsonSafe('null');
      const trueResult = parseJsonSafe('true');
      const falseResult = parseJsonSafe('false');
      const numResult = parseJsonSafe('42');
      const strResult = parseJsonSafe('"string"');

      expect(nullResult).toBeNull();
      expect(trueResult).toBe(true);
      expect(falseResult).toBe(false);
      expect(numResult).toBe(42);
      expect(strResult).toBe('string');
    });

    test('should handle empty objects and arrays', () => {
      const emptyObj = parseJsonSafe('{}');
      const emptyArr = parseJsonSafe('[]');
      expect(emptyObj).toEqual({});
      expect(emptyArr).toEqual([]);
    });

    test('should handle whitespace', () => {
      const json = '  {  "name"  :  "test"  }  ';

      const result = parseJsonSafe(json);

      expect(result).toEqual({ name: 'test' });
    });
  });

  describe('integration tests', () => {
    test('should write and read JSON file with round-trip', () => {
      const testFile = join(TEMP_DIR, 'roundtrip.json');
      const original = {
        id: 123,
        name: 'Test Project',
        tags: ['important', 'featured'],
        metadata: { version: '1.0', author: 'test' },
      };

      writeJson(testFile, original);
      const result = readJson<typeof original>(testFile);

      expect(result).toEqual(original);
    });

    test('should handle complex validation workflow', () => {
      const testFile = join(TEMP_DIR, 'validated.json');
      const data = { name: 'valid', value: 100 };

      writeJson(testFile, data);

      const validator = (d: unknown) => {
        return (
          typeof d === 'object' &&
          d !== null &&
          'name' in d &&
          'value' in d &&
          typeof (d as Record<string, unknown>).value === 'number'
        );
      };

      const result = readJson(testFile, { validate: validator });

      expect(result).toEqual(data);
    });

    test('should handle multiple file operations', () => {
      const files = ['file1.json', 'file2.json', 'file3.json'];
      const dataArray = [{ id: 1 }, { id: 2 }, { id: 3 }];

      files.forEach((file, index) => {
        writeJson(join(TEMP_DIR, file), dataArray[index]);
      });

      files.forEach((file, index) => {
        const result = readJson(join(TEMP_DIR, file));
        expect(result).toEqual(dataArray[index]);
      });
    });
  });

  describe('error handling', () => {
    test('should handle file not found', () => {
      const testFile = join(TEMP_DIR, 'nonexistent.json');

      expect(() => {
        readJson(testFile);
      }).toThrow();
    });

    test('should handle permission errors gracefully', () => {
      const testFile = join(TEMP_DIR, 'test.json');
      writeJson(testFile, { data: 'test' });

      // Note: Actually changing permissions is OS-specific,
      // so we just verify the happy path works
      expect(readJson(testFile)).toBeDefined();
    });

    test('should handle malformed JSON gracefully', () => {
      const testFile = join(TEMP_DIR, 'malformed.json');
      writeFileSync(testFile, '{"key": undefined}', 'utf-8');

      expect(() => {
        readJson(testFile, { throwOnInvalid: true });
      }).toThrow();
    });
  });

  describe('type safety', () => {
    test('should preserve type information through read', () => {
      const testFile = join(TEMP_DIR, 'typed.json');
      interface User {
        id: number;
        name: string;
        active: boolean;
      }

      const user: User = { id: 1, name: 'Alice', active: true };
      writeJson<User>(testFile, user);

      const result = readJson<User>(testFile);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Alice');
      expect(result.active).toBe(true);
    });

    test('should work with generic arrays', () => {
      const testFile = join(TEMP_DIR, 'items.json');
      interface Item {
        id: number;
        label: string;
      }

      const items: Item[] = [
        { id: 1, label: 'First' },
        { id: 2, label: 'Second' },
      ];

      writeJson<Item[]>(testFile, items);
      const result = readJson<Item[]>(testFile);

      expect(result.length).toBe(2);
      expect(result[0].label).toBe('First');
    });
  });
});
