import { ThemeCandidate } from '../theme';

export interface AnalysisReport {
  total_tools: number;
  total_categories: number;
  discovered_themes: ThemeCandidate[];
  low_confidence_themes: ThemeCandidate[];
  tag_statistics: Array<{ tag: string; count: number }>;
  recommendations: string[];
}
