/**
 * Process a key-value line match
 */
export const processKeyValueMatch = (
  keyMatch: RegExpMatchArray,
): { key: string; value: string; isInlineArray: boolean; isSimpleValue: boolean } => {
  const key = keyMatch[1];
  const value = keyMatch[2].trim();

  const isInlineArray = value.startsWith('[');
  const isSimpleValue = value !== '' && !isInlineArray;

  return { key, value, isInlineArray, isSimpleValue };
};
