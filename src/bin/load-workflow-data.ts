#!/usr/bin/env bun
/**
 * Load and format data for GitHub Actions workflows
 * This script outputs GitHub Actions formatted output for use in workflow steps
 *
 * Usage:
 *   bun run src/bin/load-workflow-data.ts load-data    # For categorize-tool workflow
 *   bun run src/bin/load-workflow-data.ts load-prompt  # For triage-submission workflow
 */

import { formatCategoriesForPrompt } from '../domain/categories';
import { formatThemesForPrompt } from '../domain/themes';
import { validateCategoriesFile, validateThemesFile } from '../validation';
import { readFileSync, appendFileSync } from 'fs';
import { join } from 'path';

const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

if (!GITHUB_OUTPUT) {
  console.error('Error: GITHUB_OUTPUT environment variable not set');
  console.error('This script is designed to run in GitHub Actions');
  process.exit(1);
}

/**
 * Write multiline output to GitHub Actions
 */
const writeOutput = (name: string, value: string): void => {
  if (!GITHUB_OUTPUT) return;
  const content = `${name}<<EOF\n${value}\nEOF\n`;
  appendFileSync(GITHUB_OUTPUT, content);
};

/**
 * Write single-line output to GitHub Actions
 */
const writeSingleLineOutput = (name: string, value: string): void => {
  if (!GITHUB_OUTPUT) return;
  const content = `${name}=${value}\n`;
  appendFileSync(GITHUB_OUTPUT, content);
};

const action = process.argv[2];

try {
  switch (action) {
    case 'load-data': {
      // Validate categories data before loading
      const categoriesPath = join(process.cwd(), 'data', 'categories.json');
      const categoriesValidation = validateCategoriesFile(categoriesPath);
      if (!categoriesValidation.valid) {
        console.error('❌ Categories validation failed:');
        categoriesValidation.errors.forEach((error) => console.error(`  - ${error}`));
        process.exit(1);
      }

      // Validate themes data before loading
      const themesPath = join(process.cwd(), 'data', 'themes.json');
      const themesValidation = validateThemesFile(themesPath);
      if (!themesValidation.valid) {
        console.error('❌ Themes validation failed:');
        themesValidation.errors.forEach((error) => console.error(`  - ${error}`));
        process.exit(1);
      }

      // Load categories JSON for the workflow
      const categoriesJson = readFileSync(categoriesPath, 'utf-8');
      const categories = JSON.parse(categoriesJson).categories;
      writeSingleLineOutput('categories', JSON.stringify(categories));

      // Format categories for prompt
      const categoriesPrompt = formatCategoriesForPrompt();
      writeOutput('categories_prompt', categoriesPrompt);

      // Format themes for prompt
      const themesPrompt = formatThemesForPrompt();
      writeOutput('themes_prompt', themesPrompt);

      // Load categorize prompt template
      const promptTemplate = readFileSync(
        join(process.cwd(), '.github', 'prompts', 'categorize-tool.md'),
        'utf-8',
      );
      writeOutput('prompt_template', promptTemplate);

      console.log('✓ Data loaded successfully for categorize-tool workflow');
      break;
    }

    case 'load-prompt': {
      // Load triage prompt template
      const prompt = readFileSync(
        join(process.cwd(), '.github', 'prompts', 'triage-relevance.md'),
        'utf-8',
      );
      writeOutput('prompt', prompt);

      console.log('✓ Prompt loaded successfully for triage-submission workflow');
      break;
    }

    default:
      console.error(`Unknown action: ${action}`);
      console.error('Valid actions: load-data, load-prompt');
      process.exit(1);
  }
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : error);
  process.exit(1);
}
