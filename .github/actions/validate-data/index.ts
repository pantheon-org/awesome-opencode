/**
 * Validate Data GitHub Action
 *
 * Validates data files (categories.json, themes.json) against JSON schemas
 * and checks for potential injection patterns.
 *
 * This action ensures data integrity and security before use in workflows.
 */

import { join } from 'path';
import { appendFileSync } from 'fs';
import { validateCategoriesFile, validateThemesFile } from '../../../src/validation';
import type { FileValidationResult, ValidateDataOutput } from './types';

const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

/**
 * Write multiline output to GitHub Actions output file
 *
 * @param name - Output variable name
 * @param value - Output value (can be multiline)
 */
const writeOutput = (name: string, value: string): void => {
  if (!GITHUB_OUTPUT) {
    console.warn(`Warning: GITHUB_OUTPUT not set, cannot write output: ${name}`);
    return;
  }
  const content = `${name}<<EOF\n${value}\nEOF\n`;
  appendFileSync(GITHUB_OUTPUT, content);
};

/**
 * Write single-line output to GitHub Actions output file
 *
 * @param name - Output variable name
 * @param value - Output value (single line)
 */
const writeSingleLineOutput = (name: string, value: string): void => {
  if (!GITHUB_OUTPUT) {
    console.warn(`Warning: GITHUB_OUTPUT not set, cannot write output: ${name}`);
    return;
  }
  const content = `${name}=${value}\n`;
  appendFileSync(GITHUB_OUTPUT, content);
};

/**
 * Validation targets to check
 */
interface ValidationTarget {
  name: string;
  path: string;
  validate: (path: string) => { valid: boolean; errors: string[] };
}

const targets: ValidationTarget[] = [
  {
    name: 'data/categories.json',
    path: join(process.cwd(), 'data', 'categories.json'),
    validate: validateCategoriesFile,
  },
  {
    name: 'data/themes.json',
    path: join(process.cwd(), 'data', 'themes.json'),
    validate: validateThemesFile,
  },
];

/**
 * Validate all data files
 *
 * @returns Validation results for all files
 * @throws Error if validation process fails
 */
export function validateDataFiles(): ValidateDataOutput {
  const results: FileValidationResult[] = [];
  let hasErrors = false;
  const startTime = Date.now();

  for (const target of targets) {
    const fileStartTime = Date.now();
    const result = target.validate(target.path);
    const fileEndTime = Date.now();
    const duration = fileEndTime - fileStartTime;

    results.push({
      filePath: target.name,
      valid: result.valid,
      errors: result.errors,
      duration,
    });

    if (result.valid) {
      console.log(`✓ ${target.name} is valid (${duration}ms)`);
    } else {
      hasErrors = true;
      console.error(`✗ ${target.name} validation failed (${duration}ms):`);
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
      console.error('');
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log(`\nTotal validation time: ${totalDuration}ms`);

  return {
    valid: !hasErrors,
    results,
    totalDuration,
    errorMessage: hasErrors
      ? 'One or more validation failures detected. Please fix the errors above.'
      : undefined,
  };
}

/**
 * Main entry point for GitHub Action
 */
async function main(): Promise<void> {
  try {
    console.log('Validating data files...\n');

    const result = validateDataFiles();

    // Write outputs to GitHub Actions
    writeSingleLineOutput('valid', String(result.valid));
    writeSingleLineOutput('total_duration', String(result.totalDuration));
    writeOutput('results', JSON.stringify(result.results, null, 2));

    if (result.errorMessage) {
      writeOutput('error_message', result.errorMessage);
    }

    if (result.valid) {
      console.log('\n✅ All data files are valid!');
    } else {
      console.error('\n❌ Validation failed. Please fix the errors above.');
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Fatal error during validation: ${message}`);
    process.exit(1);
  }
}

// Run the action
if (require.main === module) {
  main();
}
