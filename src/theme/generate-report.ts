import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCategories } from '../category';
import { getTagStats } from '../tag';
import { discoverThemes } from './discover-themes';
import { getAllTools } from './get-all-tools';
import { getActiveThemes } from './get-active-themes';
import type { Theme, ThemeCandidate, ToolInfo } from './types';
import { updateExistingThemeCounts } from './update-existing-theme-counts';

interface AnalysisReport {
  total_tools: number;
  total_categories: number;
  discovered_themes: ThemeCandidate[];
  low_confidence_themes: ThemeCandidate[];
  tag_statistics: Array<{ tag: string; count: number }>;
  recommendations: string[];
}

/**
 * Display existing themes
 */
const displayExistingThemes = (existingThemes: Theme[]): void => {
  console.log('📚 Existing Themes:\n');
  for (const theme of existingThemes) {
    console.log(`   ${theme.name} (${theme.metadata.tool_count} tools)`);
    console.log(`   └─ Keywords: ${theme.keywords.slice(0, 5).join(', ')}`);
    console.log(`   └─ Categories: ${theme.categories.join(', ')}\n`);
  }
};

/**
 * Display discovered themes with high confidence
 */
const displayHighConfidenceThemes = (highConfidence: ThemeCandidate[]): void => {
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

/**
 * Display low confidence themes
 */
const displayLowConfidenceThemes = (lowConfidence: ThemeCandidate[]): void => {
  if (lowConfidence.length === 0) return;

  console.log('\n⚠️  Low Confidence Themes (not recommended):\n');
  for (const theme of lowConfidence.slice(0, 3)) {
    console.log(
      `   - "${theme.name}" (${theme.tools.length} tools, confidence: ${theme.confidence.toFixed(2)})`,
    );
  }
};

/**
 * Display tag statistics
 */
const displayTagStats = (tagStats: Map<string, number>): void => {
  const topTags = Array.from(tagStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('\n\n🏷️  Top 10 Tags:\n');
  for (const [tag, count] of topTags) {
    console.log(`   - ${tag}: ${count} tools`);
  }
};

/**
 * Generate recommendations based on analysis
 */
const generateRecommendations = (
  existingThemes: Theme[],
  highConfidence: ThemeCandidate[],
  allTools: ToolInfo[],
): string[] => {
  const recommendations: string[] = [];

  if (existingThemes.some((t) => t.metadata.tool_count < 3)) {
    recommendations.push('Some existing themes have fewer than 3 tools - consider review');
  }

  if (highConfidence.length > 0) {
    recommendations.push(`${highConfidence.length} high-confidence theme candidates discovered`);
  }

  const toolsWithoutThemes = allTools.filter((tool) => !tool.themes || tool.themes.length === 0);
  if (toolsWithoutThemes.length > 0) {
    recommendations.push(`${toolsWithoutThemes.length} tools need theme assignment`);
  }

  return recommendations;
};

/**
 * Save report to file
 */
const saveReportToFile = (
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

/**
 * Generate analysis report
 */
export const generateReport = (outputPath?: string): void => {
  console.log('🔍 Analyzing tools across categories...\n');

  const allTools = getAllTools();
  const categories = loadCategories();
  const tagStats = getTagStats();

  console.log(`📊 Found ${allTools.length} tools across ${categories.length} categories\n`);

  const themeCandidates = discoverThemes();
  const highConfidence = themeCandidates.filter((t) => t.confidence >= 0.6);
  const lowConfidence = themeCandidates.filter((t) => t.confidence < 0.6);

  updateExistingThemeCounts();
  const existingThemes = getActiveThemes();

  displayExistingThemes(existingThemes);
  displayHighConfidenceThemes(highConfidence);
  displayLowConfidenceThemes(lowConfidence);
  displayTagStats(tagStats);

  const recommendations = generateRecommendations(existingThemes, highConfidence, allTools);

  console.log('\n\n✅ Analysis complete!');
  console.log(`💾 ${highConfidence.length} high-confidence themes discovered.\n`);

  if (recommendations.length > 0) {
    console.log('📝 Recommendations:');
    for (const rec of recommendations) {
      console.log(`   - ${rec}`);
    }
  }

  if (outputPath) {
    saveReportToFile(
      outputPath,
      allTools,
      categories,
      highConfidence,
      lowConfidence,
      tagStats,
      recommendations,
    );
  }
};
