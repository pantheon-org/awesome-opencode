#!/usr/bin/env bun
/**
 * Generate Theme Pages Script
 * Automatically generates markdown pages for each theme in docs/themes/
 * by scanning tools in docs/tools/ and organizing them by theme
 */

import { generateAllThemePages } from './generate-all-theme-pages';

// Run the script
try {
  generateAllThemePages();
} catch (error) {
  console.error('❌ Error generating theme pages:', error);
  process.exit(1);
}
