/**
 * Parse a key-value line
 */
export const parseKeyValueLine = (
  line: string,
): { key: string; value: string; isArray: boolean } => {
  const [key, ...valueParts] = line.split(':');
  const trimmedKey = key.trim();
  const value = valueParts.join(':').trim();

  if (value === '') {
    return { key: trimmedKey, value: '', isArray: true };
  }

  return {
    key: trimmedKey,
    value: value.replace(/^['"]|['"]$/g, ''),
    isArray: false,
  };
};
