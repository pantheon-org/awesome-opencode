/**
 * Validate GitHub URL GitHub Action
 *
 * Validates GitHub URLs from workflow inputs using security module.
 * Ensures URLs are properly formed and safe to use.
 *
 * This action validates and sanitizes GitHub URLs before they're used
 * in downstream workflow steps.
 */

import { appendFileSync } from 'fs';
import { sanitizeGitHubUrl, extractRepoInfo } from '../../../src/security';
import type { ValidateGitHubUrlInput, ValidateGitHubUrlOutput } from './types';

const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

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
 * Validate a GitHub URL
 *
 * @param input - Input containing URL to validate
 * @returns Validation result with sanitized URL and extracted info
 * @throws Error if URL is invalid
 */
export function validateGitHubUrl(input: ValidateGitHubUrlInput): ValidateGitHubUrlOutput {
  if (!input.url || typeof input.url !== 'string') {
    throw new Error('URL is required and must be a string');
  }

  const sanitized = sanitizeGitHubUrl(input.url);

  if (!sanitized) {
    return {
      valid: false,
      error: `Invalid GitHub URL: ${input.url}. URL must be a valid GitHub repository URL.`,
    };
  }

  // Extract repository information
  const repoInfo = extractRepoInfo(sanitized);

  return {
    valid: true,
    sanitizedUrl: sanitized,
    owner: repoInfo?.owner,
    repo: repoInfo?.repo,
  };
}

/**
 * Main entry point for GitHub Action
 */
async function main(): Promise<void> {
  try {
    // Get the action input (url)
    const url = process.env.INPUT_URL;

    if (!url) {
      console.error('Error: url input is required');
      process.exit(1);
    }

    console.log(`Validating GitHub URL: ${url}`);

    const result = validateGitHubUrl({ url });

    // Write outputs to GitHub Actions
    writeSingleLineOutput('valid', String(result.valid));

    if (result.valid) {
      if (result.sanitizedUrl) {
        writeSingleLineOutput('sanitized_url', result.sanitizedUrl);
      }
      if (result.owner) {
        writeSingleLineOutput('owner', result.owner);
      }
      if (result.repo) {
        writeSingleLineOutput('repo', result.repo);
      }
      console.log(`✓ URL is valid: ${result.sanitizedUrl}`);
      console.log(`  Owner: ${result.owner}`);
      console.log(`  Repo: ${result.repo}`);
    } else {
      writeSingleLineOutput('error', result.error || 'Unknown validation error');
      console.error(`✗ URL validation failed: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error validating GitHub URL: ${message}`);
    process.exit(1);
  }
}

// Run the action
if (require.main === module) {
  main();
}
