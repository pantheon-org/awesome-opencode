import { z } from 'zod';
import { ThemeCandidateSchema } from '../domain/themes';

/**
 * Zod schema for tag statistics
 */
const TagStatisticSchema = z.object({
  tag: z.string().describe('The tag name'),
  count: z.number().int().nonnegative().describe('Number of times the tag appears'),
});

/**
 * Zod schema for analysis report
 */
export const AnalysisReportSchema = z.object({
  total_tools: z.number().int().nonnegative().describe('Total number of tools analyzed'),
  total_categories: z.number().int().nonnegative().describe('Total number of categories'),
  discovered_themes: z.array(ThemeCandidateSchema).describe('Themes discovered during analysis'),
  low_confidence_themes: z
    .array(ThemeCandidateSchema)
    .describe('Themes with low confidence scores'),
  tag_statistics: z.array(TagStatisticSchema).describe('Statistics about tag usage'),
  recommendations: z.array(z.string()).describe('Recommendations for improvements'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;
