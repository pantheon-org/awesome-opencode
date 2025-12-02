import { ThemeCandidate } from '../domain/themes';

/**
 * Display discovered themes with high confidence
 */
export const displayHighConfidenceThemes = (highConfidence: ThemeCandidate[]): void => {
  console.log('\n💡 Discovered High-Confidence Themes:\n');
  for (const theme of highConfidence.slice(0, 5)) {
    console.log(`${theme.name} (confidence: ${theme.confidence.toFixed(2)})`);
    const toolsPreview =
      theme.tools.length > 3
        ? `${theme.tools.slice(0, 3).join(', ')}, ...`
        : theme.tools.join(', ');
    console.log(`   └─ ${theme.tools.length} tools: ${toolsPreview}`);
    console.log(`   └─ Keywords: ${theme.keywords.join(', ')}`);
    console.log(`   └─ Categories: ${theme.categories.join(', ')}\n`);
  }
};
