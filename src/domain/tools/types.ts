import { z } from 'zod';

/**
 * Zod schema for tool themes
 */
export const ToolThemesSchema = z.object({
  primary: z.string().describe('The primary theme for the tool'),
  secondary: z.array(z.string()).describe('Secondary themes associated with the tool'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type ToolThemes = z.infer<typeof ToolThemesSchema>;

/**
 * Zod schema for tool metadata
 */
export const ToolMetadataSchema = z.object({
  tool_name: z.string().describe('The name of the tool'),
  category: z.string().describe('The category of the tool'),
  themes: ToolThemesSchema.describe('Theme information for the tool'),
  tags: z.array(z.string()).describe('Tags associated with the tool'),
  repository: z.string().describe('The repository URL for the tool'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type ToolMetadata = z.infer<typeof ToolMetadataSchema>;

/**
 * Zod schema for tool frontmatter
 */
export const ToolFrontmatterSchema = z.object({
  tool_name: z.string().describe('The name of the tool'),
  repository: z.string().describe('The repository URL for the tool'),
  category: z.string().describe('The category of the tool'),
  themes: z.array(z.string()).describe('Themes associated with the tool'),
  tags: z.array(z.string()).describe('Tags associated with the tool'),
  submitted_date: z.string().optional().describe('The date the tool was submitted'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type ToolFrontmatter = z.infer<typeof ToolFrontmatterSchema>;

/**
 * Zod schema for tool info (extends ToolFrontmatter)
 */
export const ToolInfoSchema = ToolFrontmatterSchema.extend({
  filename: z.string().describe('The filename of the tool'),
  description: z.string().describe('A description of the tool'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type ToolInfo = z.infer<typeof ToolInfoSchema>;
