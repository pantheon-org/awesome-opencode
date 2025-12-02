/**
 * Save current key-value to frontmatter
 */
export const saveCurrentKeyValue = (
  frontmatter: Record<string, unknown>,
  currentKey: string,
  currentValue: unknown,
): void => {
  if (currentKey && currentValue !== '') {
    frontmatter[currentKey] = currentValue;
  }
};
