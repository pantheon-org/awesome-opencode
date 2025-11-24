#!/usr/bin/env bun
/**
 * Theme Analysis Script
 * Scans existing tools to discover potential themes
 */

import { getAllTools, getTagStats, normalizeTag } from './tags.js';
import { loadThemes, getActiveThemes, saveThemes } from './themes.js';
import { loadCategories } from './categories.js';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface ThemeCandidate {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  categories: string[];
  tools: string[];
  confidence: number;
}

interface AnalysisReport {
  total_tools: number;
  total_categories: number;
  discovered_themes: ThemeCandidate[];
  low_confidence_themes: ThemeCandidate[];
  tag_statistics: { tag: string; count: number }[];
  recommendations: string[];
}

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

/**
 * Discover themes from existing tools using tag clustering
 */
const discoverThemes = (): ThemeCandidate[] => {
  const allTools = getAllTools();
  const tagStats = getTagStats();
  const themes: ThemeCandidate[] = [];

  // Get popular tags (appearing in 3+ tools)
  const popularTags = Array.from(tagStats.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  // Group tools by popular tags
  for (const tag of popularTags) {
    const toolsWithTag = allTools.filter((tool) => tool.tags.map(normalizeTag).includes(tag));

    if (toolsWithTag.length < 3) continue;

    // Find related tags (co-occurring tags)
    const relatedTags = new Map<string, number>();
    for (const tool of toolsWithTag) {
      for (const toolTag of tool.tags) {
        const normalized = normalizeTag(toolTag);
        if (normalized !== tag) {
          relatedTags.set(normalized, (relatedTags.get(normalized) || 0) + 1);
        }
      }
    }

    // Get top related tags
    const keywords = [
      tag,
      ...Array.from(relatedTags.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([t]) => t),
    ];

    // Get categories represented
    const toolCategories = [...new Set(toolsWithTag.map((tool) => tool.category))];

    // Calculate confidence
    const confidence = calculateConfidence(
      toolsWithTag.map((t) => t.tool_name),
      keywords,
      toolCategories,
    );

    // Generate theme candidate
    const themeId = `${tag}-tools`;
    const themeName = tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    themes.push({
      id: themeId,
      name: `${themeName} Tools`,
      description: `Tools focused on ${tag} capabilities and workflows`,
      keywords,
      categories: toolCategories,
      tools: toolsWithTag.map((t) => t.tool_name),
      confidence,
    });
  }

  return themes;
};

/**
 * Update tool counts for existing themes
 */
const updateExistingThemeCounts = (): void => {
  const config = loadThemes();
  const allTools = getAllTools();

  for (const theme of config.themes) {
    // Count tools in theme's categories with matching keywords
    const toolsInTheme = allTools.filter((tool) => {
      // Tool must be in one of the theme's categories
      if (!theme.categories.includes(tool.category)) return false;

      // Tool tags or description should match theme keywords
      const toolTags = tool.tags.map(normalizeTag);
      return theme.keywords.some((keyword) => toolTags.includes(normalizeTag(keyword)));
    });

    theme.metadata.tool_count = toolsInTheme.length;
  }

  saveThemes(config);
};

/**
 * Generate analysis report
 */
const generateReport = (outputPath?: string): void => {
  console.log('🔍 Analyzing tools across categories...\n');

  const allTools = getAllTools();
  const categories = loadCategories();
  const tagStats = getTagStats();

  console.log(`📊 Found ${allTools.length} tools across ${categories.length} categories\n`);

  // Discover new themes
  const themeCandidates = discoverThemes();
  const highConfidence = themeCandidates.filter((t) => t.confidence >= 0.6);
  const lowConfidence = themeCandidates.filter((t) => t.confidence < 0.6);

  // Update existing theme counts
  updateExistingThemeCounts();
  const existingThemes = getActiveThemes();

  // Display existing themes
  console.log('📚 Existing Themes:\n');
  for (const theme of existingThemes) {
    console.log(`   ${theme.name} (${theme.metadata.tool_count} tools)`);
    console.log(`   └─ Keywords: ${theme.keywords.slice(0, 5).join(', ')}`);
    console.log(`   └─ Categories: ${theme.categories.join(', ')}\n`);
  }

  // Display discovered themes
  console.log('\n💡 Discovered High-Confidence Themes:\n');
  for (const theme of highConfidence.slice(0, 5)) {
    console.log(`${theme.name} (confidence: ${theme.confidence.toFixed(2)})`);
    console.log(
      `   └─ ${theme.tools.length} tools: ${theme.tools.slice(0, 3).join(', ')}${theme.tools.length > 3 ? ', ...' : ''}`,
    );
    console.log(`   └─ Keywords: ${theme.keywords.join(', ')}`);
    console.log(`   └─ Categories: ${theme.categories.join(', ')}\n`);
  }

  if (lowConfidence.length > 0) {
    console.log('\n⚠️  Low Confidence Themes (not recommended):\n');
    for (const theme of lowConfidence.slice(0, 3)) {
      console.log(
        `   - "${theme.name}" (${theme.tools.length} tools, confidence: ${theme.confidence.toFixed(2)})`,
      );
    }
  }

  // Display tag statistics
  const topTags = Array.from(tagStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('\n\n🏷️  Top 10 Tags:\n');
  for (const [tag, count] of topTags) {
    console.log(`   - ${tag}: ${count} tools`);
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (existingThemes.some((t) => t.metadata.tool_count < 3)) {
    recommendations.push('Some existing themes have fewer than 3 tools - consider review');
  }

  if (highConfidence.length > 0) {
    recommendations.push(`${highConfidence.length} high-confidence theme candidates discovered`);
  }

  const toolsWithoutThemes = allTools.filter(
    (tool) => !tool.themes?.primary || tool.themes.primary === '',
  );
  if (toolsWithoutThemes.length > 0) {
    recommendations.push(`${toolsWithoutThemes.length} tools need theme assignment`);
  }

  console.log('\n\n✅ Analysis complete!');
  console.log(`💾 ${highConfidence.length} high-confidence themes discovered.\n`);

  if (recommendations.length > 0) {
    console.log('📝 Recommendations:');
    for (const rec of recommendations) {
      console.log(`   - ${rec}`);
    }
  }

  // Save report to file if requested
  if (outputPath) {
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
  }
};

// CLI execution
const main = () => {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : undefined;

  try {
    generateReport(outputPath);
  } catch (error) {
    console.error('Error during analysis:', error);
    process.exit(1);
  }
};

main();
