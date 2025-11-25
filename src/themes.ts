/**
 * Theme management utilities
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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

/**
 * Load themes from themes.json
 */
export const loadThemes = (): ThemesConfig => {
  const configPath = join(process.cwd(), 'themes.json');

  if (!existsSync(configPath)) {
    throw new Error('themes.json not found in project root');
  }

  const config: ThemesConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
  return config;
};

/**
 * Get a theme by ID
 */
export const getThemeById = (id: string): Theme | undefined => {
  const config = loadThemes();
  return config.themes.find((theme) => theme.id === id);
};

/**
 * Get all active themes
 */
export const getActiveThemes = (): Theme[] => {
  const config = loadThemes();
  return config.themes.filter((theme) => theme.status === 'active');
};

/**
 * Get all themes under review
 */
export const getThemesUnderReview = (): Theme[] => {
  const config = loadThemes();
  return config.themes.filter((theme) => theme.status === 'under_review');
};

/**
 * Save themes configuration to themes.json
 */
export const saveThemes = (config: ThemesConfig): void => {
  const configPath = join(process.cwd(), 'themes.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
};

/**
 * Add a new theme to the configuration
 * @param theme - The theme to add
 * @param requiresApproval - Whether the theme requires manual approval (default: true for auto-discovered)
 */
export const addTheme = (theme: Theme, requiresApproval = true): void => {
  const config = loadThemes();

  // Check if theme already exists
  if (config.themes.some((t) => t.id === theme.id)) {
    throw new Error(`Theme with id "${theme.id}" already exists`);
  }

  // Set status based on approval requirement
  if (requiresApproval && theme.metadata.auto_discovered) {
    theme.status = 'under_review';
  }

  config.themes.push(theme);
  saveThemes(config);
};

/**
 * Update an existing theme
 */
export const updateTheme = (id: string, updates: Partial<Theme>): void => {
  const config = loadThemes();
  const themeIndex = config.themes.findIndex((t) => t.id === id);

  if (themeIndex === -1) {
    throw new Error(`Theme with id "${id}" not found`);
  }

  config.themes[themeIndex] = {
    ...config.themes[themeIndex],
    ...updates,
  };

  saveThemes(config);
};

/**
 * Update theme tool count
 */
export const updateThemeToolCount = (id: string, count: number): void => {
  const config = loadThemes();
  const theme = config.themes.find((t) => t.id === id);

  if (!theme) {
    throw new Error(`Theme with id "${id}" not found`);
  }

  theme.metadata.tool_count = count;

  // Check if theme should enter review
  if (count < 3 && theme.status === 'active') {
    theme.status = 'under_review';
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 30);
    theme.metadata.review_date = reviewDate.toISOString().split('T')[0];
  }

  saveThemes(config);
};

/**
 * Mark a theme for review
 */
export const reviewTheme = (id: string, action: 'keep' | 'archive' | 'delete'): void => {
  const config = loadThemes();
  const themeIndex = config.themes.findIndex((t) => t.id === id);

  if (themeIndex === -1) {
    throw new Error(`Theme with id "${id}" not found`);
  }

  switch (action) {
    case 'keep':
      config.themes[themeIndex].status = 'active';
      delete config.themes[themeIndex].metadata.review_date;
      delete config.themes[themeIndex].metadata.review_issue;
      break;
    case 'archive':
      config.themes[themeIndex].status = 'archived';
      break;
    case 'delete':
      config.themes.splice(themeIndex, 1);
      break;
  }

  saveThemes(config);
};

/**
 * Get themes by category
 */
export const getThemesByCategory = (categorySlug: string): Theme[] => {
  const config = loadThemes();
  return config.themes.filter(
    (theme) => theme.status === 'active' && theme.categories.includes(categorySlug),
  );
};

/**
 * Format themes for OpenCode prompt
 */
export const formatThemesForPrompt = (): string => {
  const themes = getActiveThemes();
  return themes
    .map(
      (theme) =>
        `   - ${theme.id}: ${theme.description}\n     Keywords: ${theme.keywords.join(', ')}`,
    )
    .join('\n');
};

/**
 * Get suggested tags list
 */
export const getSuggestedTags = (): string[] => {
  const config = loadThemes();
  return config.suggested_tags;
};

/**
 * Add a suggested tag if it doesn't already exist
 */
export const addSuggestedTag = (tag: string): void => {
  const config = loadThemes();

  if (!config.suggested_tags.includes(tag)) {
    config.suggested_tags.push(tag);
    config.suggested_tags.sort();
    saveThemes(config);
  }
};

/**
 * Get theme configuration as JSON string for workflows
 */
export const getThemesAsJson = (): string => {
  const config = loadThemes();
  return JSON.stringify(config, null, 2);
};

/**
 * Add a new theme or return existing if it already exists
 * Used during tool submission to handle auto-discovered themes
 * @param themeData - Partial theme data from OpenCode
 * @returns The theme ID
 */
export const addOrGetTheme = (themeData: {
  id: string;
  name: string;
  description: string;
  keywords?: string[];
  categories?: string[];
}): string => {
  const config = loadThemes();
  const existingTheme = config.themes.find((t) => t.id === themeData.id);

  if (existingTheme) {
    return existingTheme.id;
  }

  // Create new theme with pending-review status
  const newTheme: Theme = {
    id: themeData.id,
    name: themeData.name,
    description: themeData.description,
    keywords: themeData.keywords || [],
    categories: themeData.categories || [],
    status: 'under_review',
    metadata: {
      auto_discovered: true,
      tool_count: 1,
      created_date: new Date().toISOString().split('T')[0],
      approved_by: null,
    },
  };

  config.themes.push(newTheme);
  saveThemes(config);

  return newTheme.id;
};

/**
 * Activate pending themes (change status from under_review to active)
 * Called during PR merge workflow
 * @param themeIds - Array of theme IDs to activate
 */
export const activateThemes = (themeIds: string[]): void => {
  const config = loadThemes();
  let modified = false;

  for (const themeId of themeIds) {
    const theme = config.themes.find((t) => t.id === themeId);
    if (theme && theme.status === 'under_review') {
      theme.status = 'active';
      theme.metadata.approved_by = 'manual';
      modified = true;
    }
  }

  if (modified) {
    saveThemes(config);
  }
};

/**
 * Increment tool count for themes
 * @param themeIds - Array of theme IDs to increment
 */
export const incrementThemeToolCounts = (themeIds: string[]): void => {
  const config = loadThemes();
  let modified = false;

  for (const themeId of themeIds) {
    const theme = config.themes.find((t) => t.id === themeId);
    if (theme) {
      theme.metadata.tool_count += 1;
      modified = true;
    }
  }

  if (modified) {
    saveThemes(config);
  }
};
