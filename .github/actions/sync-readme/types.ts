/**
 * Type definitions for the sync-readme GitHub Action
 */

/**
 * Output data structure for the sync-readme action
 */
export interface SyncReadmeOutput {
  /**
   * Whether the README was successfully updated
   */
  success: boolean;

  /**
   * Number of themes processed
   */
  themesCount: number;

  /**
   * Number of categories processed
   */
  categoriesCount: number;

  /**
   * Summary message
   */
  message: string;
}

/**
 * Result type for README sync operations
 */
export type SyncReadmeResult = {
  success: boolean;
  data?: SyncReadmeOutput;
  error?: string;
};
