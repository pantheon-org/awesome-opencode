#!/usr/bin/env bun
/**
 * Theme Analysis Script
 * Scans existing tools to discover potential themes
 */

import { generateReport } from '../generate-report';

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
