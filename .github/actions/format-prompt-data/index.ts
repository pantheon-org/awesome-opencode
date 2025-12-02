/**
 * Format prompt data GitHub Action
 *
 * Formats data for use in AI prompts with proper sanitization and XML wrapping
 * to prevent prompt injection attacks.
 *
 * This action ensures all data passed to AI models is properly formatted,
 * sanitized, and wrapped in XML tags for safe handling.
 */

import { appendFileSync } from 'fs';
import { sanitizeTextContent } from '../../../src/security';
import type { FormatPromptDataInput, FormatPromptDataOutput } from './types';

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
 * Format raw data for safe use in AI prompts
 *
 * Performs the following:
 * 1. Converts data to string if needed
 * 2. Sanitizes content to prevent prompt injection
 * 3. Wraps in XML tags for added safety
 *
 * @param input - Raw data to format
 * @returns Formatted data with both plain and wrapped versions
 * @throws Error if data cannot be formatted
 */
export function formatPromptData(input: FormatPromptDataInput): FormatPromptDataOutput {
  // Convert data to string if needed
  let dataString: string;
  if (typeof input.rawData === 'string') {
    dataString = input.rawData;
  } else if (typeof input.rawData === 'object' && input.rawData !== null) {
    dataString = JSON.stringify(input.rawData, null, 2);
  } else {
    dataString = String(input.rawData);
  }

  // Sanitize the data to prevent prompt injection
  const sanitized = sanitizeTextContent(dataString);

  // Wrap in XML tags for additional safety
  const wrapped = `<formatted_data>\n${sanitized}\n</formatted_data>`;

  return {
    formattedData: sanitized,
    wrappedData: wrapped,
  };
}

/**
 * Main entry point for GitHub Action
 * Reads action inputs and formats requested data
 */
async function main(): Promise<void> {
  try {
    // Get the action input (raw-data)
    const rawDataInput = process.env.INPUT_RAW_DATA;

    if (!rawDataInput) {
      console.warn('No raw-data input provided, formatting empty string');
    }

    const rawData = rawDataInput ? JSON.parse(rawDataInput) : '';

    console.log('Formatting data for safe prompt usage');

    const result = formatPromptData({ rawData });

    // Write outputs to GitHub Actions
    writeOutput('formatted_data', result.formattedData);
    writeOutput('wrapped_data', result.wrappedData);

    console.log('✓ Data formatted successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error formatting data: ${message}`);
    process.exit(1);
  }
}

// Run the action
if (require.main === module) {
  main();
}
