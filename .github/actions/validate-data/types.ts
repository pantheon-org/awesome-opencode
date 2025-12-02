/**
 * Type definitions for the validate-data GitHub Action
 */

/**
 * Validation result for a single file
 */
export interface FileValidationResult {
  /**
   * File path that was validated
   */
  filePath: string;

  /**
   * Whether validation passed
   */
  valid: boolean;

  /**
   * List of validation errors
   */
  errors: string[];

  /**
   * Validation duration in milliseconds
   */
  duration: number;
}

/**
 * Output data structure for the validate-data action
 */
export interface ValidateDataOutput {
  /**
   * Overall validation success status
   */
  valid: boolean;

  /**
   * Results for each validated file
   */
  results: FileValidationResult[];

  /**
   * Total validation duration in milliseconds
   */
  totalDuration: number;

  /**
   * Error message if validation failed
   */
  errorMessage?: string;
}

/**
 * Result type for data validation operations
 */
export type ValidateDataResult = {
  success: boolean;
  data?: ValidateDataOutput;
  error?: string;
};
