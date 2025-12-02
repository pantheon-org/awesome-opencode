#!/usr/bin/env bun
/**
 * Generate Theme Recommendations Module
 *
 * Generates theme recommendations based on tool analysis
 */

import { generateAllThemePages } from '../../domain/themes';

/**
 * Generate theme recommendations
 *
 * Automatically generates markdown pages for each theme in docs/themes/
 * by scanning tools in docs/tools/ and organizing them by theme
 */
export const generateRecommendations = (): void => {
  try {
    generateAllThemePages();
  } catch (error) {
    console.error('❌ Error generating theme pages:', error);
    throw error;
  }
};

// CLI execution
if (import.meta.main) {
  try {
    generateRecommendations();
  } catch (error) {
    console.error('❌ Error generating theme recommendations:', error);
    process.exit(1);
  }
}
