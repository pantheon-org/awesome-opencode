import { writeFileSync } from 'node:fs';
import { join } from 'path';
import { ThemeCandidate } from '../domain/themes';
import { ToolInfo } from '../domain/tools';
import { AnalysisReport } from './types';

/**
 * Save report to file
 */
export const saveReportToFile = (
  outputPath: string,
  allTools: ToolInfo[],
  categories: unknown[],
  highConfidence: ThemeCandidate[],
  lowConfidence: ThemeCandidate[],
  tagStats: Map<string, number>,
  recommendations: string[],
): void => {
  const topTags = Array.from(tagStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const report: AnalysisReport = {
    total_tools: allTools.length,
    total_categories: categories.length,
    discovered_themes: highConfidence,
    low_confidence_themes: lowConfidence,
    tag_statistics: topTags.map(([tag, count]) => ({ tag, count })),
    recommendations,
  };

  writeFileSync(join(process.cwd(), outputPath), JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n💾 Detailed report saved to ${outputPath}`);
};
