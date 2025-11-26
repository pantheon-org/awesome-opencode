import { z } from 'zod';

/**
 * Zod schema for theme status
 */
export const ThemeStatusSchema = z.enum(['active', 'under_review', 'archived']);

/**
 * Inferred TypeScript type from the Zod schema
 */
export type ThemeStatus = z.infer<typeof ThemeStatusSchema>;

/**
 * Zod schema for theme metadata
 */
const ThemeMetadataSchema = z.object({
  auto_discovered: z.boolean().describe('Whether the theme was automatically discovered'),
  tool_count: z.number().int().nonnegative().describe('Number of tools associated with the theme'),
  created_date: z.string().describe('Date the theme was created'),
  approved_by: z.union([z.literal('manual'), z.null()]).describe('How the theme was approved'),
  review_date: z.string().optional().describe('Date the theme was reviewed'),
  review_issue: z.string().optional().describe('GitHub issue URL for the review'),
});

/**
 * Zod schema for a theme
 */
export const ThemeSchema = z.object({
  id: z.string().describe('Unique identifier for the theme'),
  name: z.string().describe('Display name of the theme'),
  description: z.string().describe('A description of the theme'),
  keywords: z.array(z.string()).describe('Keywords associated with the theme'),
  categories: z.array(z.string()).describe('Categories this theme relates to'),
  status: ThemeStatusSchema.describe('Current status of the theme'),
  metadata: ThemeMetadataSchema.describe('Metadata about the theme'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type Theme = z.infer<typeof ThemeSchema>;

/**
 * Zod schema for theme discovery configuration
 */
export const ThemeDiscoveryConfigSchema = z.object({
  minToolsPerTheme: z
    .number()
    .int()
    .positive()
    .describe('Minimum number of tools required for a theme'),
  maxThemesPerTool: z.number().int().positive().describe('Maximum number of themes per tool'),
  confidenceThreshold: z
    .number()
    .min(0)
    .max(1)
    .describe('Minimum confidence score for theme assignment'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type ThemeDiscoveryConfig = z.infer<typeof ThemeDiscoveryConfigSchema>;

/**
 * Zod schema for themes configuration
 */
export const ThemesConfigSchema = z.object({
  themes: z.array(ThemeSchema).describe('Array of theme definitions'),
  suggested_tags: z.array(z.string()).describe('Suggested tags for themes'),
  seed_themes: z.array(z.string()).describe('Seed themes to start discovery'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type ThemesConfig = z.infer<typeof ThemesConfigSchema>;

/**
 * Zod schema for a theme candidate
 */
export const ThemeCandidateSchema = z.object({
  id: z.string().describe('Unique identifier for the theme candidate'),
  name: z.string().describe('Display name of the theme candidate'),
  description: z.string().describe('A description of the theme candidate'),
  keywords: z.array(z.string()).describe('Keywords associated with the theme candidate'),
  categories: z.array(z.string()).describe('Categories this theme candidate relates to'),
  tools: z.array(z.string()).describe('Tools associated with this theme candidate'),
  confidence: z.number().min(0).max(1).describe('Confidence score for the theme candidate'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type ThemeCandidate = z.infer<typeof ThemeCandidateSchema>;
