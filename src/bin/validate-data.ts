#!/usr/bin/env bun
/**
 * CLI tool for validating data files
 * Validates categories.json and themes.json against JSON schemas
 * and checks for potential injection patterns
 *
 * Usage:
 *   bun run src/bin/validate-data.ts
 *   bun run validate:data
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - One or more validations failed
 */

import { join } from 'path';
import { validateCategoriesFile, validateThemesFile } from '../validation';

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
 * Main validation routine
 */
async function main(): Promise<void> {
  console.log('Validating data files...\n');

  let hasErrors = false;
  const startTime = Date.now();

  for (const target of targets) {
    const fileStartTime = Date.now();
    const result = target.validate(target.path);
    const fileEndTime = Date.now();
    const duration = fileEndTime - fileStartTime;

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

  if (hasErrors) {
    console.error('\n❌ Validation failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All data files are valid!');
    process.exit(0);
  }
}

// Run validation
main().catch((error) => {
  console.error('Fatal error during validation:', error);
  process.exit(1);
});
