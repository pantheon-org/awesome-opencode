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

export interface ThemeCandidate {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  categories: string[];
  tools: string[];
  confidence: number;
}
