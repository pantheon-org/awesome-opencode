import { z } from 'zod';

/**
 * Zod schema for tag validation results
 */
export const TagValidationResultSchema = z.object({
  valid: z.boolean().describe('Whether the tag is valid'),
  normalized: z.string().describe('The normalized version of the tag'),
  suggestion: z.string().optional().describe('Optional suggestion for invalid tags'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type TagValidationResult = z.infer<typeof TagValidationResultSchema>;
