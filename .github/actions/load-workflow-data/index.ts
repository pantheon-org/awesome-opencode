/**
 * Load workflow data GitHub Action
 *
 * Loads configuration, prompts, and templates for use in GitHub Actions workflows.
 * Supports multiple data types and validates data integrity.
 *
 * This action serves as the bridge between domain modules (src/category, src/theme)
 * and GitHub workflows, handling data loading, formatting, and validation.
 */

import { readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { formatCategoriesForPrompt } from '../../../src/category/format-categories-for-prompt';
import { formatThemesForPrompt } from '../../../src/theme/format-themes-for-prompt';
import { validateCategoriesFile, validateThemesFile } from '../../../src/validation';
import type { WorkflowDataInput, WorkflowDataOutput } from './types';

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
 * Load data for categorize-tool workflow
 * Loads categories, themes, and prompt template for tool categorization
 *
 * @returns Loaded data with formatted prompts and templates
 * @throws Error if validation fails or files cannot be read
 */
async function loadCategorizeToolData(): Promise<WorkflowDataOutput> {
  // Validate categories data before loading
  const categoriesPath = join(process.cwd(), 'data', 'categories.json');
  const categoriesValidation = validateCategoriesFile(categoriesPath);
  if (!categoriesValidation.valid) {
    const errors = categoriesValidation.errors.map((e: string) => `  - ${e}`).join('\n');
    throw new Error(`Categories validation failed:\n${errors}`);
  }

  // Validate themes data before loading
  const themesPath = join(process.cwd(), 'data', 'themes.json');
  const themesValidation = validateThemesFile(themesPath);
  if (!themesValidation.valid) {
    const errors = themesValidation.errors.map((e: string) => `  - ${e}`).join('\n');
    throw new Error(`Themes validation failed:\n${errors}`);
  }

  // Load categories JSON for the workflow
  const categoriesJson = readFileSync(categoriesPath, 'utf-8');
  const categories = JSON.parse(categoriesJson).categories;

  // Format categories for prompt
  const categoriesPrompt = formatCategoriesForPrompt();

  // Format themes for prompt
  const themesPrompt = formatThemesForPrompt();

  // Load categorize prompt template
  const promptTemplate = readFileSync(
    join(process.cwd(), '.github', 'prompts', 'categorize-tool.md'),
    'utf-8',
  );

  return {
    data: categoriesJson,
    categories: JSON.stringify(categories),
    categoriesPrompt,
    themesPrompt,
    promptTemplate,
  };
}

/**
 * Load data for triage-submission workflow
 * Loads prompt template for tool submission triage
 *
 * @returns Loaded prompt template
 * @throws Error if prompt file cannot be read
 */
async function loadTriageSubmissionData(): Promise<WorkflowDataOutput> {
  // Load triage prompt template
  const prompt = readFileSync(
    join(process.cwd(), '.github', 'prompts', 'triage-relevance.md'),
    'utf-8',
  );

  return {
    data: prompt,
    prompt,
  };
}

/**
 * Load workflow data based on input type
 *
 * @param input - Input parameters specifying data type to load
 * @returns Loaded and formatted data ready for use in workflows
 * @throws Error if data type is invalid or loading fails
 */
export async function loadWorkflowData(input: WorkflowDataInput): Promise<WorkflowDataOutput> {
  switch (input.dataType) {
    case 'prompt':
      return loadTriageSubmissionData();

    case 'config':
      return loadCategorizeToolData();

    case 'template':
      return loadCategorizeToolData();

    default:
      throw new Error(`Unknown data type: ${input.dataType}`);
  }
}

/**
 * Main entry point for GitHub Action
 * Reads action inputs and loads requested data
 */
async function main(): Promise<void> {
  try {
    // Get the action input (data-type) from environment or command line argument
    let dataType = (process.env.INPUT_DATA_TYPE ||
      process.argv[2] ||
      'prompt') as WorkflowDataInput['dataType'];

    // Support old-style action argument (for backward compatibility)
    if (process.argv[2]) {
      // Map old action names to new data types
      const actionMap: Record<string, WorkflowDataInput['dataType']> = {
        'load-data': 'config',
        'load-prompt': 'prompt',
      };
      dataType = actionMap[process.argv[2]] || (process.argv[2] as WorkflowDataInput['dataType']);
    }

    console.log(`Loading workflow data: ${dataType}`);

    const result = await loadWorkflowData({ dataType });

    // Write outputs to GitHub Actions
    if (result.data) {
      writeOutput('data', result.data);
    }

    if (result.prompt) {
      writeOutput('prompt', result.prompt);
    }

    if (result.categories) {
      writeSingleLineOutput('categories', result.categories);
    }

    if (result.categoriesPrompt) {
      writeOutput('categories_prompt', result.categoriesPrompt);
    }

    if (result.themesPrompt) {
      writeOutput('themes_prompt', result.themesPrompt);
    }

    if (result.promptTemplate) {
      writeOutput('prompt_template', result.promptTemplate);
    }

    console.log(`✓ Workflow data loaded successfully (${dataType})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error loading workflow data: ${message}`);
    process.exit(1);
  }
}

// Run the action
if (require.main === module) {
  main();
}
