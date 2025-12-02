/**
 * Process an array item line
 */
export const processArrayItem = (line: string, currentValue: unknown): void => {
  const value = line.trim().substring(1).trim();
  if (Array.isArray(currentValue)) {
    currentValue.push(value);
  }
};
