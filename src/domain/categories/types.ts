import { z } from 'zod';

/**
 * Zod schema for a category
 */
export const CategorySchema = z.object({
  slug: z.string().describe('The URL-friendly slug for the category'),
  title: z.string().describe('The display title of the category'),
  description: z.string().describe('A description of the category'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type Category = z.infer<typeof CategorySchema>;

/**
 * Zod schema for the categories configuration
 */
export const CategoriesConfigSchema = z.object({
  categories: z.array(CategorySchema).describe('Array of category definitions'),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type CategoriesConfig = z.infer<typeof CategoriesConfigSchema>;
