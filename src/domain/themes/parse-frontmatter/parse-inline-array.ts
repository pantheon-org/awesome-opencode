/**
 * Parse inline array value
 */
export const parseInlineArray = (value: string): string[] => {
  const arrayMatch = value.match(/\[(.*)\]/);
  return arrayMatch ? arrayMatch[1].split(',').map((v) => v.trim().replace(/['"]/g, '')) : [];
};
