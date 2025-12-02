/**
 * Type definitions for the load-workflow-data GitHub Action
 */

/**
 * Input parameters for the load-workflow-data action
 */
export interface WorkflowDataInput {
  /**
   * Type of data to load
   * - 'prompt': Load prompt templates for workflows
   * - 'config': Load configuration data
   * - 'template': Load template files
   */
  dataType: 'prompt' | 'config' | 'template';
}

/**
 * Output data structure for the load-workflow-data action
 */
export interface WorkflowDataOutput {
  /**
   * Raw data content loaded from files
   */
  data: string;

  /**
   * Formatted prompt template (if applicable)
   */
  prompt?: string;

  /**
   * Categories formatted for prompt injection prevention
   */
  categoriesPrompt?: string;

  /**
   * Themes formatted for prompt injection prevention
   */
  themesPrompt?: string;

  /**
   * Serialized categories data as JSON
   */
  categories?: string;

  /**
   * Prompt template content
   */
  promptTemplate?: string;
}

/**
 * Result type for data loading operations
 */
export type WorkflowDataResult = {
  success: boolean;
  data?: WorkflowDataOutput;
  error?: string;
};
