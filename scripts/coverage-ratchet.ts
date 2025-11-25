#!/usr/bin/env bun
/**
 * Coverage Ratchet Script
 * Ensures test coverage only increases, never decreases
 * Enhanced with per-module tracking for security and validation modules
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface ModuleCoverage {
  functions: number;
  lines: number;
}

interface CoverageData {
  overall: ModuleCoverage;
  security: ModuleCoverage;
  validation: ModuleCoverage;
  timestamp: string;
}

const COVERAGE_FILE = join(process.cwd(), '.coverage-ratchet.json');
const SECURITY_COVERAGE_MIN = 90;
const VALIDATION_COVERAGE_MIN = 90;

/**
 * Parse coverage output from bun test --coverage
 */
const parseCoverageOutput = (
  output: string,
): {
  overall: ModuleCoverage;
  security: ModuleCoverage;
  validation: ModuleCoverage;
} | null => {
  // Parse overall coverage
  const allFilesMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/);

  if (!allFilesMatch) {
    console.error('Could not parse overall coverage output');
    console.error('Output sample:', output.substring(0, 500));
    return null;
  }

  const overall: ModuleCoverage = {
    functions: parseFloat(allFilesMatch[1]),
    lines: parseFloat(allFilesMatch[2]),
  };

  // Parse security module coverage by aggregating individual files
  // Since Bun doesn't give directory-level summaries, we calculate from files
  const securityFiles = output.match(/src\/security\/[^\s]+\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/g);
  let security: ModuleCoverage = { functions: 0, lines: 0 };

  if (securityFiles && securityFiles.length > 0) {
    let totalFunctions = 0;
    let totalLines = 0;

    for (const file of securityFiles) {
      const match = file.match(/\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/);
      if (match) {
        totalFunctions += parseFloat(match[1]);
        totalLines += parseFloat(match[2]);
      }
    }

    security = {
      functions: totalFunctions / securityFiles.length,
      lines: totalLines / securityFiles.length,
    };
  }

  // Parse validation module coverage similarly
  const validationFiles = output.match(
    /src\/validation\/[^\s]+\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/g,
  );
  let validation: ModuleCoverage = { functions: 0, lines: 0 };

  if (validationFiles && validationFiles.length > 0) {
    let totalFunctions = 0;
    let totalLines = 0;

    for (const file of validationFiles) {
      const match = file.match(/\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/);
      if (match) {
        totalFunctions += parseFloat(match[1]);
        totalLines += parseFloat(match[2]);
      }
    }

    validation = {
      functions: totalFunctions / validationFiles.length,
      lines: totalLines / validationFiles.length,
    };
  }

  return { overall, security, validation };
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
const saveCoverage = (coverage: Omit<CoverageData, 'timestamp'>): void => {
  const data: CoverageData = {
    ...coverage,
    timestamp: new Date().toISOString(),
  };

  writeFileSync(COVERAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log('\n✅ Coverage ratchet updated:');
  console.log(
    `   Overall:    ${coverage.overall.functions}% functions, ${coverage.overall.lines}% lines`,
  );
  console.log(
    `   Security:   ${coverage.security.functions}% functions, ${coverage.security.lines}% lines`,
  );
  console.log(
    `   Validation: ${coverage.validation.functions}% functions, ${coverage.validation.lines}% lines`,
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

  console.log('\n📊 Current Coverage:');
  console.log(
    `   Overall:    ${currentCoverage.overall.functions}% functions, ${currentCoverage.overall.lines}% lines`,
  );
  console.log(
    `   Security:   ${currentCoverage.security.functions}% functions, ${currentCoverage.security.lines}% lines`,
  );
  console.log(
    `   Validation: ${currentCoverage.validation.functions}% functions, ${currentCoverage.validation.lines}% lines`,
  );

  // Check minimum thresholds for security modules
  if (
    currentCoverage.security.lines > 0 &&
    currentCoverage.security.lines < SECURITY_COVERAGE_MIN
  ) {
    console.error(`\n❌ Security module coverage below minimum (${SECURITY_COVERAGE_MIN}%)`);
    console.error(`   Current: ${currentCoverage.security.lines}%`);
    process.exit(1);
  }

  // Check minimum thresholds for validation modules
  if (
    currentCoverage.validation.lines > 0 &&
    currentCoverage.validation.lines < VALIDATION_COVERAGE_MIN
  ) {
    console.error(`\n❌ Validation module coverage below minimum (${VALIDATION_COVERAGE_MIN}%)`);
    console.error(`   Current: ${currentCoverage.validation.lines}%`);
    process.exit(1);
  }

  // Load previous coverage
  const previousCoverage = loadPreviousCoverage();

  if (!previousCoverage) {
    console.log('\n📊 No previous coverage data found. Establishing baseline...');
    saveCoverage(currentCoverage);
    process.exit(0);
  }

  // Display previous coverage
  console.log('\n📊 Previous Coverage:');
  console.log(
    `   Overall:    ${previousCoverage.overall.functions}% functions, ${previousCoverage.overall.lines}% lines`,
  );
  console.log(
    `   Security:   ${previousCoverage.security.functions}% functions, ${previousCoverage.security.lines}% lines`,
  );
  console.log(
    `   Validation: ${previousCoverage.validation.functions}% functions, ${previousCoverage.validation.lines}% lines`,
  );

  // Check for regressions
  let hasRegression = false;

  // Check overall coverage
  const overallFunctionsDelta =
    currentCoverage.overall.functions - previousCoverage.overall.functions;
  const overallLinesDelta = currentCoverage.overall.lines - previousCoverage.overall.lines;

  console.log('\n📊 Coverage Comparison:');
  console.log('   Overall:');
  console.log(
    `      Functions: ${previousCoverage.overall.functions}% → ${currentCoverage.overall.functions}% (${overallFunctionsDelta >= 0 ? '+' : ''}${overallFunctionsDelta.toFixed(2)}%)`,
  );
  console.log(
    `      Lines:     ${previousCoverage.overall.lines}% → ${currentCoverage.overall.lines}% (${overallLinesDelta >= 0 ? '+' : ''}${overallLinesDelta.toFixed(2)}%)`,
  );

  if (overallFunctionsDelta < -0.01 || overallLinesDelta < -0.01) {
    console.error('\n❌ Overall coverage decreased!');
    hasRegression = true;
  }

  // Check security module coverage
  if (currentCoverage.security.lines > 0 && previousCoverage.security.lines > 0) {
    const securityFunctionsDelta =
      currentCoverage.security.functions - previousCoverage.security.functions;
    const securityLinesDelta = currentCoverage.security.lines - previousCoverage.security.lines;

    console.log('   Security:');
    console.log(
      `      Functions: ${previousCoverage.security.functions}% → ${currentCoverage.security.functions}% (${securityFunctionsDelta >= 0 ? '+' : ''}${securityFunctionsDelta.toFixed(2)}%)`,
    );
    console.log(
      `      Lines:     ${previousCoverage.security.lines}% → ${currentCoverage.security.lines}% (${securityLinesDelta >= 0 ? '+' : ''}${securityLinesDelta.toFixed(2)}%)`,
    );

    if (securityFunctionsDelta < -0.01 || securityLinesDelta < -0.01) {
      console.error('\n❌ Security module coverage decreased!');
      hasRegression = true;
    }
  }

  // Check validation module coverage
  if (currentCoverage.validation.lines > 0 && previousCoverage.validation.lines > 0) {
    const validationFunctionsDelta =
      currentCoverage.validation.functions - previousCoverage.validation.functions;
    const validationLinesDelta =
      currentCoverage.validation.lines - previousCoverage.validation.lines;

    console.log('   Validation:');
    console.log(
      `      Functions: ${previousCoverage.validation.functions}% → ${currentCoverage.validation.functions}% (${validationFunctionsDelta >= 0 ? '+' : ''}${validationFunctionsDelta.toFixed(2)}%)`,
    );
    console.log(
      `      Lines:     ${previousCoverage.validation.lines}% → ${currentCoverage.validation.lines}% (${validationLinesDelta >= 0 ? '+' : ''}${validationLinesDelta.toFixed(2)}%)`,
    );

    if (validationFunctionsDelta < -0.01 || validationLinesDelta < -0.01) {
      console.error('\n❌ Validation module coverage decreased!');
      hasRegression = true;
    }
  }

  if (hasRegression) {
    console.error('\n❌ The ratchet prevents coverage from decreasing.');
    process.exit(1);
  }

  if (
    overallFunctionsDelta > 0.01 ||
    overallLinesDelta > 0.01 ||
    (currentCoverage.security.lines > 0 &&
      (currentCoverage.security.functions > previousCoverage.security.functions ||
        currentCoverage.security.lines > previousCoverage.security.lines)) ||
    (currentCoverage.validation.lines > 0 &&
      (currentCoverage.validation.functions > previousCoverage.validation.functions ||
        currentCoverage.validation.lines > previousCoverage.validation.lines))
  ) {
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
