/**
 * Save current key-value pair to frontmatter
 */
export const saveKeyValue = (
  frontmatter: Record<string, unknown>,
  key: string,
  value: string[],
  inArray: boolean,
): void => {
  if (!key) return;

  if (inArray) {
    frontmatter[key] = value;
  } else {
    frontmatter[key] = value.join('\n');
  }
};
