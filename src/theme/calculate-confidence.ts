/**
 * Calculate confidence score for a theme candidate
 */
const calculateConfidence = (tools: string[], keywords: string[], categories: string[]): number => {
  let confidence = 0;

  // Base confidence on number of tools
  if (tools.length >= 5) confidence += 0.4;
  else if (tools.length >= 3) confidence += 0.3;
  else confidence += 0.15;

  // Add confidence for keyword coherence
  if (keywords.length >= 3) confidence += 0.2;
  else if (keywords.length >= 2) confidence += 0.1;

  // Add confidence for category span
  if (categories.length >= 2) confidence += 0.2;
  else if (categories.length === 1) confidence += 0.1;

  // Cap at 1.0
  return Math.min(confidence, 1.0);
};
