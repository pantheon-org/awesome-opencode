#!/usr/bin/env bun
/**
 * Coverage Ratchet Script
 * Ensures test coverage only increases, never decreases
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface CoverageData {
  functions: number;
  lines: number;
  timestamp: string;
}

const COVERAGE_FILE = join(process.cwd(), '.coverage-ratchet.json');

/**
 * Parse coverage output from bun test --coverage
 */
const parseCoverageOutput = (output: string): { functions: number; lines: number } | null => {
  // Look for the "All files" line which has aggregate coverage
  // Format: All files                                            |  100.00 |  100.00 |
  const allFilesMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/);

  if (!allFilesMatch) {
    console.error('Could not parse coverage output');
    console.error('Output sample:', output.substring(0, 500));
    return null;
  }

  return {
    functions: parseFloat(allFilesMatch[1]),
    lines: parseFloat(allFilesMatch[2]),
  };
};

/**
 * Load previous coverage data
 */
const loadPreviousCoverage = (): CoverageData | null => {
  if (!existsSync(COVERAGE_FILE)) {
    return null;
  }

  try {
    const data = readFileSync(COVERAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Could not load previous coverage data:', error);
    return null;
  }
};

/**
 * Save current coverage data
 */
const saveCoverage = (coverage: { functions: number; lines: number }): void => {
  const data: CoverageData = {
    ...coverage,
    timestamp: new Date().toISOString(),
  };

  writeFileSync(COVERAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(
    `\n✅ Coverage ratchet updated: ${coverage.functions}% functions, ${coverage.lines}% lines`,
  );
};

/**
 * Main ratchet check
 */
const checkCoverageRatchet = async (): Promise<void> => {
  console.log('🔍 Running coverage ratchet check...\n');

  // Run tests with coverage
  const proc = Bun.spawn(['bun', 'test', '--coverage'], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;
  const output = stdout + stderr;

  if (exitCode !== 0) {
    console.error('❌ Tests failed');
    console.error(output);
    process.exit(1);
  }

  console.log(output);

  // Parse current coverage
  const currentCoverage = parseCoverageOutput(output);
  if (!currentCoverage) {
    process.exit(1);
  }

  // Load previous coverage
  const previousCoverage = loadPreviousCoverage();

  if (!previousCoverage) {
    console.log('\n📊 No previous coverage data found. Establishing baseline...');
    saveCoverage(currentCoverage);
    process.exit(0);
  }

  // Check if coverage decreased
  const functionsDelta = currentCoverage.functions - previousCoverage.functions;
  const linesDelta = currentCoverage.lines - previousCoverage.lines;

  console.log('\n📊 Coverage Comparison:');
  console.log(
    `   Functions: ${previousCoverage.functions}% -> ${currentCoverage.functions}% (${functionsDelta >= 0 ? '+' : ''}${functionsDelta.toFixed(2)}%)`,
  );
  console.log(
    `   Lines: ${previousCoverage.lines}% -> ${currentCoverage.lines}% (${linesDelta >= 0 ? '+' : ''}${linesDelta.toFixed(2)}%)`,
  );

  if (functionsDelta < -0.01 || linesDelta < -0.01) {
    console.error('\n❌ Coverage decreased! The ratchet prevents this.');
    console.error(
      `   Minimum required: ${previousCoverage.functions}% functions, ${previousCoverage.lines}% lines`,
    );
    console.error(
      `   Current coverage: ${currentCoverage.functions}% functions, ${currentCoverage.lines}% lines`,
    );
    process.exit(1);
  }

  if (functionsDelta > 0.01 || linesDelta > 0.01) {
    console.log('\n🎉 Coverage increased! Updating ratchet...');
    saveCoverage(currentCoverage);
  } else {
    console.log('\n✅ Coverage maintained at baseline.');
  }
};

// Run the ratchet check
checkCoverageRatchet().catch((error) => {
  console.error('Error running coverage ratchet:', error);
  process.exit(1);
});
