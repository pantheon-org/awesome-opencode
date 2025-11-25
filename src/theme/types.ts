export type ThemeStatus = 'active' | 'under_review' | 'archived';

export interface Theme {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  categories: string[];
  status: ThemeStatus;
  metadata: {
    auto_discovered: boolean;
    tool_count: number;
    created_date: string;
    approved_by: 'manual' | null;
    review_date?: string;
    review_issue?: string;
  };
}

export interface ToolThemes {
  primary: string;
  secondary: string[];
}

export interface ToolMetadata {
  tool_name: string;
  category: string;
  themes: ToolThemes;
  tags: string[];
  repository: string;
}

export interface ThemeDiscoveryConfig {
  minToolsPerTheme: number;
  maxThemesPerTool: number;
  confidenceThreshold: number;
}

export interface ThemesConfig {
  themes: Theme[];
  suggested_tags: string[];
  seed_themes: string[];
}

export interface ToolFrontmatter {
  tool_name: string;
  repository: string;
  category: string;
  themes: string[];
  tags: string[];
  submitted_date?: string;
}

export interface ToolInfo extends ToolFrontmatter {
  filename: string;
  description: string;
}

export interface ThemeCandidate {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  categories: string[];
  tools: string[];
  confidence: number;
}

export interface AnalysisReport {
  total_tools: number;
  total_categories: number;
  discovered_themes: ThemeCandidate[];
  low_confidence_themes: ThemeCandidate[];
  tag_statistics: { tag: string; count: number }[];
  recommendations: string[];
}
