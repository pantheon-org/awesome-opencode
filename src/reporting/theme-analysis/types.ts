/**
 * Theme Analysis Module Type Definitions
 *
 * Defines types for theme analysis reports and statistics
 */

/**
 * Statistical information about a single theme
 */
export interface ThemeStatistics {
  id: string;
  name: string;
  toolCount: number;
  confidence: number;
  relatedCategories: string[];
}

/**
 * Complete theme analysis report
 */
export interface ThemeAnalysisReport {
  themes: ThemeStatistics[];
  totalTools: number;
  timestamp: string;
  recommendations: string[];
}
