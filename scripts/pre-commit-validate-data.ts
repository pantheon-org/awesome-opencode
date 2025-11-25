#!/usr/bin/env bun
/**
 * Pre-commit validation for data files
 * Validates only staged data files for faster commit workflow
 *
 * Usage:
 *   bun run scripts/pre-commit-validate-data.ts data/categories.json data/themes.json
 *   Called automatically by lefthook when data/*.json files are staged
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - One or more validations failed
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { validateCategoriesFile, validateThemesFile } from '../src/validation';

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  duration: number;
}

/**
 * Get list of staged files to validate
 * If no args provided, validates all data files
 */
function getStagedFiles(): string[] {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // No files provided, validate all data files
    return [
      join(process.cwd(), 'data', 'categories.json'),
      join(process.cwd(), 'data', 'themes.json'),
    ];
  }

  // Return absolute paths
  return args.map((file) => {
    if (file.startsWith('/')) {
      return file;
    }
    return join(process.cwd(), file);
  });
}

/**
 * Validate a single data file
 */
function validateFile(filePath: string): ValidationResult {
  const startTime = Date.now();
  const fileName = filePath.split('/').pop() || filePath;

  if (!existsSync(filePath)) {
    return {
      file: fileName,
      valid: false,
      errors: [`File not found: ${filePath}`],
      duration: Date.now() - startTime,
    };
  }

  let result: { valid: boolean; errors: string[] };

  if (filePath.includes('categories.json')) {
    result = validateCategoriesFile(filePath);
  } else if (filePath.includes('themes.json')) {
    result = validateThemesFile(filePath);
  } else {
    // Unknown file type, skip validation
    return {
      file: fileName,
      valid: true,
      errors: [],
      duration: Date.now() - startTime,
    };
  }

  return {
    file: fileName,
    valid: result.valid,
    errors: result.errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Main validation routine
 */
async function main(): Promise<void> {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('✓ No data files to validate');
    process.exit(0);
  }

  console.log('Validating staged data files...\n');

  const results: ValidationResult[] = [];
  const startTime = Date.now();

  for (const file of stagedFiles) {
    const result = validateFile(file);
    results.push(result);

    if (result.valid) {
      console.log(`✓ ${result.file} is valid (${result.duration}ms)`);
    } else {
      console.error(`✗ ${result.file} validation failed (${result.duration}ms):`);
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
      console.error('');
    }
  }

  const totalDuration = Date.now() - startTime;
  const hasErrors = results.some((r) => !r.valid);

  if (hasErrors) {
    console.error('❌ Pre-commit validation failed!\n');
    console.error('To fix:');
    console.error('  1. Run: bun run fix:data');
    console.error('  2. Review and fix reported errors manually');
    console.error('  3. Stage fixed files: git add data/*.json');
    console.error('  4. Try commit again\n');
    console.error('To bypass (emergency only):');
    console.error('  git commit --no-verify\n');
    process.exit(1);
  }

  console.log(`\n✅ All staged data files validated successfully! (${totalDuration}ms)\n`);
  process.exit(0);
}

// Run validation
main().catch((error) => {
  console.error('Fatal error during validation:', error);
  process.exit(1);
});
