import { describe, test, expect, afterEach, beforeEach } from 'bun:test';
import { join } from 'path';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import {
  readFile,
  writeFile,
  fileExists,
  ensureDirectory,
  deleteFile,
  listFiles,
} from './file-operations';

const TEMP_DIR = join(import.meta.dir, '.test-temp');

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

describe('file-operations', () => {
  describe('readFile', () => {
    test('should read file with default utf-8 encoding', () => {
      const testFile = join(TEMP_DIR, 'test.txt');
      const content = 'Hello, World!';
      writeFileSync(testFile, content, 'utf-8');

      const result = readFile(testFile);
      expect(result).toBe(content);
    });

    test('should read file with custom encoding', () => {
      const testFile = join(TEMP_DIR, 'test.txt');
      const content = 'Test content';
      writeFileSync(testFile, content, 'utf-8');

      const result = readFile(testFile, { encoding: 'utf-8' });
      expect(result).toBe(content);
    });

    test('should throw when file not found and throwIfNotFound is true', () => {
      const testFile = join(TEMP_DIR, 'nonexistent.txt');

      expect(() => {
        readFile(testFile, { throwIfNotFound: true });
      }).toThrow();
    });

    test('should return empty string when file not found and throwIfNotFound is false', () => {
      const testFile = join(TEMP_DIR, 'nonexistent.txt');

      const result = readFile(testFile, { throwIfNotFound: false });
      expect(result).toBe('');
    });

    test('should read multiline files', () => {
      const testFile = join(TEMP_DIR, 'multiline.txt');
      const content = 'Line 1\nLine 2\nLine 3';
      writeFileSync(testFile, content, 'utf-8');

      const result = readFile(testFile);
      expect(result).toBe(content);
    });

    test('should read files with special characters', () => {
      const testFile = join(TEMP_DIR, 'special.txt');
      const content = 'Special: @#$%^&*() 你好';
      writeFileSync(testFile, content, 'utf-8');

      const result = readFile(testFile);
      expect(result).toBe(content);
    });
  });

  describe('writeFile', () => {
    test('should write file with default encoding', () => {
      const testFile = join(TEMP_DIR, 'output.txt');
      const content = 'Test content';

      writeFile(testFile, content);

      expect(fileExists(testFile)).toBe(true);
      expect(readFile(testFile)).toBe(content);
    });

    test('should write file with custom encoding', () => {
      const testFile = join(TEMP_DIR, 'output.txt');
      const content = 'Test content';

      writeFile(testFile, content, { encoding: 'utf-8' });

      expect(readFile(testFile)).toBe(content);
    });

    test('should create directories when createDirectories is true', () => {
      const testFile = join(TEMP_DIR, 'deep', 'nested', 'path', 'file.txt');
      const content = 'Test content';

      writeFile(testFile, content, { createDirectories: true });

      expect(fileExists(testFile)).toBe(true);
      expect(readFile(testFile)).toBe(content);
    });

    test('should overwrite existing file', () => {
      const testFile = join(TEMP_DIR, 'file.txt');
      writeFileSync(testFile, 'Original', 'utf-8');

      writeFile(testFile, 'Updated');

      expect(readFile(testFile)).toBe('Updated');
    });

    test('should write empty content', () => {
      const testFile = join(TEMP_DIR, 'empty.txt');

      writeFile(testFile, '');

      expect(readFile(testFile)).toBe('');
    });

    test('should write multiline content', () => {
      const testFile = join(TEMP_DIR, 'multiline.txt');
      const content = 'Line 1\nLine 2\nLine 3';

      writeFile(testFile, content);

      expect(readFile(testFile)).toBe(content);
    });
  });

  describe('fileExists', () => {
    test('should return true for existing file', () => {
      const testFile = join(TEMP_DIR, 'test.txt');
      writeFileSync(testFile, 'content', 'utf-8');

      expect(fileExists(testFile)).toBe(true);
    });

    test('should return false for non-existing file', () => {
      const testFile = join(TEMP_DIR, 'nonexistent.txt');

      expect(fileExists(testFile)).toBe(false);
    });

    test('should return true for existing directory', () => {
      expect(fileExists(TEMP_DIR)).toBe(true);
    });
  });

  describe('ensureDirectory', () => {
    test('should create directory if it does not exist', () => {
      const testDir = join(TEMP_DIR, 'newdir');

      expect(fileExists(testDir)).toBe(false);
      ensureDirectory(testDir);
      expect(fileExists(testDir)).toBe(true);
    });

    test('should not fail if directory already exists', () => {
      const testDir = join(TEMP_DIR, 'existingdir');
      mkdirSync(testDir, { recursive: true });

      expect(() => {
        ensureDirectory(testDir);
      }).not.toThrow();
    });

    test('should create nested directories recursively', () => {
      const testDir = join(TEMP_DIR, 'a', 'b', 'c', 'd');

      ensureDirectory(testDir);

      expect(fileExists(testDir)).toBe(true);
    });
  });

  describe('deleteFile', () => {
    test('should delete existing file', () => {
      const testFile = join(TEMP_DIR, 'test.txt');
      writeFileSync(testFile, 'content', 'utf-8');

      const result = deleteFile(testFile);

      expect(result).toBe(true);
      expect(fileExists(testFile)).toBe(false);
    });

    test('should return false for non-existing file', () => {
      const testFile = join(TEMP_DIR, 'nonexistent.txt');

      const result = deleteFile(testFile);

      expect(result).toBe(false);
    });

    test('should only delete files, not directories', () => {
      const testDir = join(TEMP_DIR, 'testdir');
      mkdirSync(testDir);

      // Deleting a directory should throw
      expect(() => {
        deleteFile(testDir);
      }).toThrow();
    });
  });

  describe('listFiles', () => {
    test('should list all files in directory', () => {
      const file1 = join(TEMP_DIR, 'file1.txt');
      const file2 = join(TEMP_DIR, 'file2.txt');
      writeFileSync(file1, 'content1', 'utf-8');
      writeFileSync(file2, 'content2', 'utf-8');

      const files = listFiles(TEMP_DIR);

      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
      expect(files.length).toBe(2);
    });

    test('should filter files by pattern', () => {
      writeFileSync(join(TEMP_DIR, 'test1.txt'), 'content1', 'utf-8');
      writeFileSync(join(TEMP_DIR, 'test2.txt'), 'content2', 'utf-8');
      writeFileSync(join(TEMP_DIR, 'other.json'), 'content3', 'utf-8');

      const txtFiles = listFiles(TEMP_DIR, '.*\\.txt$');

      expect(txtFiles).toContain('test1.txt');
      expect(txtFiles).toContain('test2.txt');
      expect(txtFiles).not.toContain('other.json');
    });

    test('should return empty array for empty directory', () => {
      const emptyDir = join(TEMP_DIR, 'empty');
      mkdirSync(emptyDir);

      const files = listFiles(emptyDir);

      expect(files.length).toBe(0);
    });

    test('should throw for non-existing directory', () => {
      const nonExistentDir = join(TEMP_DIR, 'nonexistent');

      expect(() => {
        listFiles(nonExistentDir);
      }).toThrow();
    });

    test('should throw for invalid regex pattern', () => {
      writeFileSync(join(TEMP_DIR, 'test.txt'), 'content', 'utf-8');

      expect(() => {
        listFiles(TEMP_DIR, '[invalid(regex');
      }).toThrow();
    });

    test('should handle multiple file types', () => {
      writeFileSync(join(TEMP_DIR, 'file.txt'), 'content1', 'utf-8');
      writeFileSync(join(TEMP_DIR, 'file.json'), 'content2', 'utf-8');
      writeFileSync(join(TEMP_DIR, 'file.md'), 'content3', 'utf-8');

      const allFiles = listFiles(TEMP_DIR);

      expect(allFiles.length).toBe(3);
    });
  });

  describe('integration tests', () => {
    test('should handle complex file operations workflow', () => {
      const dir = join(TEMP_DIR, 'project');
      const file = join(dir, 'test.txt');
      const content = 'Project content';

      // Create directory and file
      writeFile(file, content, { createDirectories: true });
      expect(fileExists(file)).toBe(true);

      // Read file
      expect(readFile(file)).toBe(content);

      // List files
      expect(listFiles(dir)).toContain('test.txt');

      // Delete file
      expect(deleteFile(file)).toBe(true);
      expect(fileExists(file)).toBe(false);
    });

    test('should handle multiple files in nested structure', () => {
      const dir1 = join(TEMP_DIR, 'dir1');
      const dir2 = join(TEMP_DIR, 'dir2');
      const file1 = join(dir1, 'file1.txt');
      const file2 = join(dir2, 'file2.txt');

      writeFile(file1, 'Content 1', { createDirectories: true });
      writeFile(file2, 'Content 2', { createDirectories: true });

      expect(readFile(file1)).toBe('Content 1');
      expect(readFile(file2)).toBe('Content 2');
      expect(listFiles(dir1)).toContain('file1.txt');
      expect(listFiles(dir2)).toContain('file2.txt');
    });
  });
});
