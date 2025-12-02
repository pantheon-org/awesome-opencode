import { ThemeCandidate } from '../domain/themes';

/**
 * Display low confidence themes
 */
export const displayLowConfidenceThemes = (lowConfidence: ThemeCandidate[]): void => {
  if (lowConfidence.length === 0) return;

  console.log('\n⚠️  Low Confidence Themes (not recommended):\n');
  for (const theme of lowConfidence.slice(0, 3)) {
    console.log(
      `   - "${theme.name}" (${theme.tools.length} tools, confidence: ${theme.confidence.toFixed(2)})`,
    );
  }
};
