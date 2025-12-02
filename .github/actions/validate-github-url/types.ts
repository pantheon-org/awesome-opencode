/**
 * Type definitions for the validate-github-url GitHub Action
 */

/**
 * Input parameters for the validate-github-url action
 */
export interface ValidateGitHubUrlInput {
  /**
   * GitHub URL to validate
   */
  url: string;
}

/**
 * GitHub URL validation result
 */
export interface GitHubUrlValidationResult {
  /**
   * Whether the URL is valid
   */
  isValid: boolean;

  /**
   * The sanitized/validated URL if valid
   */
  url?: string;

  /**
   * Reason for validation failure if invalid
   */
  reason?: string;

  /**
   * Extracted repository owner
   */
  owner?: string;

  /**
   * Extracted repository name
   */
  repo?: string;
}

/**
 * Output data structure for the validate-github-url action
 */
export interface ValidateGitHubUrlOutput {
  /**
   * Whether the URL is valid
   */
  valid: boolean;

  /**
   * The sanitized URL
   */
  sanitizedUrl?: string;

  /**
   * Validation error message
   */
  error?: string;

  /**
   * Extracted repository owner
   */
  owner?: string;

  /**
   * Extracted repository name
   */
  repo?: string;
}

/**
 * Result type for URL validation operations
 */
export type ValidateGitHubUrlResult = {
  success: boolean;
  data?: ValidateGitHubUrlOutput;
  error?: string;
};
