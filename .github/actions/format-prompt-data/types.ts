/**
 * Type definitions for the format-prompt-data GitHub Action
 */

/**
 * Input parameters for the format-prompt-data action
 */
export interface FormatPromptDataInput {
  /**
   * Raw data to format for prompts (JSON string or plain text)
   */
  rawData: unknown;
}

/**
 * Output data structure for the format-prompt-data action
 */
export interface FormatPromptDataOutput {
  /**
   * Formatted and sanitized data ready for AI prompts
   */
  formattedData: string;

  /**
   * XML-wrapped formatted data for safe prompt injection prevention
   */
  wrappedData: string;
}

/**
 * Result type for data formatting operations
 */
export type FormatPromptDataResult = {
  success: boolean;
  data?: FormatPromptDataOutput;
  error?: string;
};
