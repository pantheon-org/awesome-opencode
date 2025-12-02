import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { dirname } from 'path';

export interface FileReadOptions {
  encoding?: BufferEncoding;
  throwIfNotFound?: boolean;
}

export interface FileWriteOptions {
  encoding?: BufferEncoding;
  createDirectories?: boolean;
}

/**
 * Reads a file synchronously with optional error handling
 * @param path - Path to the file
 * @param options - Read options (encoding, throwIfNotFound)
 * @returns File content as string
 * @throws Error if file not found and throwIfNotFound is true
 */
export const readFile = (path: string, options: FileReadOptions = {}): string => {
  const { encoding = 'utf-8', throwIfNotFound = true } = options;

  try {
    return readFileSync(path, encoding);
  } catch (error) {
    if (throwIfNotFound) throw error;
    return '';
  }
};

/**
 * Writes content to a file synchronously
 * @param path - Path to the file
 * @param content - Content to write
 * @param options - Write options (encoding, createDirectories)
 * @throws Error if directory creation fails
 */
export const writeFile = (path: string, content: string, options: FileWriteOptions = {}): void => {
  const { encoding = 'utf-8', createDirectories = true } = options;

  if (createDirectories) {
    const dir = dirname(path);
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  writeFileSync(path, content, encoding);
};

/**
 * Checks if a file exists
 * @param path - Path to check
 * @returns True if file exists, false otherwise
 */
export const fileExists = (path: string): boolean => existsSync(path);

/**
 * Ensures a directory exists, creating it recursively if necessary
 * @param path - Directory path to ensure
 */
export const ensureDirectory = (path: string): void => {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
};

/**
 * Deletes a file if it exists
 * @param path - Path to the file
 * @returns True if file was deleted, false if it didn't exist
 */
export const deleteFile = (path: string): boolean => {
  if (existsSync(path)) {
    rmSync(path);
    return true;
  }
  return false;
};

/**
 * Lists files in a directory, optionally filtering by pattern
 * @param path - Directory path
 * @param pattern - Optional regex pattern to filter files
 * @returns Array of file names matching the pattern
 * @throws Error if directory doesn't exist
 */
export const listFiles = (path: string, pattern?: string): string[] => {
  if (!existsSync(path)) {
    throw new Error(`Directory not found: ${path}`);
  }

  const files = readdirSync(path);

  if (!pattern) {
    return files;
  }

  try {
    const regex = new RegExp(pattern);
    return files.filter((file) => regex.test(file));
  } catch {
    throw new Error(`Invalid pattern: ${pattern}`);
  }
};
