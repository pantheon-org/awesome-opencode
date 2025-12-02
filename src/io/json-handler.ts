import { readFileSync, writeFileSync } from 'fs';

export interface JsonReadOptions {
  validate?: (data: unknown) => boolean;
  throwOnInvalid?: boolean;
}

export interface JsonWriteOptions {
  pretty?: boolean;
  spaces?: number;
}

/**
 * Reads and parses a JSON file
 * @param path - Path to the JSON file
 * @param options - Read options (validate, throwOnInvalid)
 * @returns Parsed JSON data
 * @throws Error if file cannot be read or JSON is invalid (when throwOnInvalid is true)
 */
export const readJson = <T>(path: string, options: JsonReadOptions = {}): T => {
  const { validate, throwOnInvalid = true } = options;

  try {
    const content = readFileSync(path, 'utf-8');
    const data = JSON.parse(content) as T;

    if (validate && !validate(data)) {
      const error = new Error(`Invalid JSON structure in ${path}`);
      if (throwOnInvalid) {
        throw error;
      }
      console.warn(error.message);
      return undefined as T;
    }

    return data;
  } catch (error) {
    if (!throwOnInvalid && error instanceof SyntaxError) {
      return undefined as T;
    }
    throw error;
  }
};

/**
 * Writes data to a JSON file
 * @param path - Path to write to
 * @param data - Data to write
 * @param options - Write options (pretty, spaces)
 */
export const writeJson = <T>(path: string, data: T, options: JsonWriteOptions = {}): void => {
  const { pretty = true, spaces = 2 } = options;

  const content = pretty ? JSON.stringify(data, null, spaces) : JSON.stringify(data);
  writeFileSync(path, content, 'utf-8');
};

/**
 * Safely parses a JSON string without reading from file
 * @param content - JSON string content
 * @param options - Parse options (validate, throwOnInvalid)
 * @returns Parsed data or null if invalid
 * @throws Error if JSON is invalid and throwOnInvalid is true
 */
export const parseJsonSafe = <T>(content: string, options: JsonReadOptions = {}): T | null => {
  const { validate, throwOnInvalid = false } = options;

  try {
    const data = JSON.parse(content) as T;

    if (validate && !validate(data)) {
      const error = new Error('Invalid JSON structure');
      if (throwOnInvalid) {
        throw error;
      }
      console.warn(error.message);
      return null;
    }

    return data;
  } catch (error) {
    if (throwOnInvalid) {
      throw error;
    }
    return null;
  }
};
