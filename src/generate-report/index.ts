import { loadCategories } from '../domain/categories';
import { getTagStats } from '../domain/tags';
import {
  discoverThemes,
  getActiveThemes,
  updateExistingThemeCounts,
  getAllTools,
} from '../domain/themes';
import { displayExistingThemes } from './display-existing-themes';
import { displayHighConfidenceThemes } from './display-high-confidence-themes';
import { saveReportToFile } from './save-report-to-file';
import { generateRecommendations } from './generate-recommendations';
import { displayTagStats } from './display-tag-stats';
import { displayLowConfidenceThemes } from './display-low-confidence-themes';

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
