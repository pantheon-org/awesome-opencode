#!/usr/bin/env bun
/**
 * CLI script for formatting data for GitHub Actions workflow prompts
 *
 * Usage:
 *   bun run src/bin/format-prompt-data.ts categories        # Output formatted categories
 *   bun run src/bin/format-prompt-data.ts themes            # Output formatted themes
 *   bun run src/bin/format-prompt-data.ts prompt <filename> # Output prompt template
 */

import { formatCategoriesForPrompt } from '../category';
import { formatThemesForPrompt } from '../theme';
import { readFileSync } from 'fs';
import { join } from 'path';

const action = process.argv[2];
const arg = process.argv[3];

try {
  switch (action) {
    case 'categories':
      console.log(formatCategoriesForPrompt());
      break;

    case 'themes':
      console.log(formatThemesForPrompt());
      break;

    case 'prompt': {
      if (!arg) {
        console.error('Error: prompt filename required');
        console.error('Usage: format-prompt-data.ts prompt <filename>');
        process.exit(1);
      }
      const promptPath = join(process.cwd(), '.github', 'prompts', arg);
      const prompt = readFileSync(promptPath, 'utf-8');
      console.log(prompt);
      break;
    }

    default:
      console.error(`Unknown action: ${action}`);
      console.error('Valid actions: categories, themes, prompt');
      process.exit(1);
  }
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : error);
  process.exit(1);
}
