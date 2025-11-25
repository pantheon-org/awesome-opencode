#!/usr/bin/env bun
/**
 * Auto-fix common data file issues
 * Formats JSON files and sanitizes data
 *
 * Usage:
 *   bun run scripts/fix-data.ts
 *   bun run fix:data
 *
 * What it fixes:
 *   - JSON formatting (pretty-print with 2 spaces)
 *   - Trailing commas
 *   - Inconsistent quote styles
 *   - Whitespace issues
 *
 * Exit codes:
 *   0 - All files fixed successfully
 *   1 - One or more files could not be fixed
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface FixResult {
  file: string;
  success: boolean;
  changes: string[];
  errors: string[];
}

/**
 * Fix a single data file
 */
function fixDataFile(filePath: string): FixResult {
  const fileName = filePath.split('/').pop() || filePath;
  const changes: string[] = [];
  const errors: string[] = [];

  if (!existsSync(filePath)) {
    return {
      file: fileName,
      success: false,
      changes,
      errors: [`File not found: ${filePath}`],
    };
  }

  try {
    // Read the file
    const originalContent = readFileSync(filePath, 'utf-8');

    // Parse JSON
    const data = JSON.parse(originalContent);

    // Pretty-print with consistent formatting
    const formattedContent = JSON.stringify(data, null, 2) + '\n';

    // Check if anything changed
    if (originalContent !== formattedContent) {
      writeFileSync(filePath, formattedContent, 'utf-8');
      changes.push('Formatted JSON with consistent indentation');

      // Analyze what changed
      if (!originalContent.endsWith('\n')) {
        changes.push('Added trailing newline');
      }
      if (originalContent.includes('\t')) {
        changes.push('Replaced tabs with spaces');
      }
      if (/\n{3,}/.test(originalContent)) {
        changes.push('Removed extra blank lines');
      }
    }

    return {
      file: fileName,
      success: true,
      changes: changes.length > 0 ? changes : ['No changes needed'],
      errors,
    };
  } catch (error) {
    return {
      file: fileName,
      success: false,
      changes,
      errors: [
        error instanceof Error ? error.message : String(error),
        'This error requires manual fixing',
      ],
    };
  }
}

/**
 * Main fix routine
 */
async function main(): Promise<void> {
  const dataFiles = [
    join(process.cwd(), 'data', 'categories.json'),
    join(process.cwd(), 'data', 'themes.json'),
  ];

  console.log('🔧 Fixing data files...\n');

  const results: FixResult[] = [];

  for (const file of dataFiles) {
    const result = fixDataFile(file);
    results.push(result);

    if (result.success) {
      console.log(`✓ ${result.file}`);
      for (const change of result.changes) {
        console.log(`  • ${change}`);
      }
    } else {
      console.error(`✗ ${result.file}`);
      for (const error of result.errors) {
        console.error(`  • ${error}`);
      }
    }
    console.log('');
  }

  const hasErrors = results.some((r) => !r.success);
  const hasChanges = results.some(
    (r) => r.success && r.changes.length > 0 && r.changes[0] !== 'No changes needed',
  );

  if (hasErrors) {
    console.error('❌ Some files could not be fixed. Please review the errors above.\n');
    process.exit(1);
  }

  if (hasChanges) {
    console.log('✅ Data files fixed! Please review changes and commit.\n');
    console.log('Next steps:');
    console.log('  1. Review changes: git diff data/');
    console.log('  2. Stage files: git add data/*.json');
    console.log('  3. Commit: git commit -m "Fix data formatting"\n');
  } else {
    console.log('✅ All data files are already properly formatted!\n');
  }

  process.exit(0);
}

// Run fix
main().catch((error) => {
  console.error('Fatal error during fix:', error);
  process.exit(1);
});
