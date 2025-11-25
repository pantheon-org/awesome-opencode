/**
 * Extract description from markdown content
 */
export const extractDescription = (content: string): string => {
  // Remove frontmatter
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Look for **Description:** line
  const descMatch = withoutFrontmatter.match(/\*\*Description:\*\*\s*(.+)/);
  if (descMatch) {
    return descMatch[1].trim();
  }

  // Fallback: get first paragraph after title
  const lines = withoutFrontmatter.split('\n').filter((l) => l.trim());
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] && !lines[i].startsWith('#') && !lines[i].startsWith('**')) {
      return lines[i].trim();
    }
  }

  return 'No description available';
};
