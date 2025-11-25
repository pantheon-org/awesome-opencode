import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ThemesConfig } from './types';
import { validateThemes } from '../validation';

/**
 * Load themes from data/themes.json
 *
 * Validates the data against JSON schema and checks for injection patterns
 * before returning the themes.
 *
 * @throws {Error} If file not found or validation fails
 */
export const loadThemes = (): ThemesConfig => {
  const configPath = join(process.cwd(), 'data', 'themes.json');

  if (!existsSync(configPath)) {
    throw new Error('data/themes.json not found in project root');
  }

  const content = readFileSync(configPath, 'utf-8');
  const config: ThemesConfig = JSON.parse(content);

  // Validate data structure and security
  const validation = validateThemes(config);
  if (!validation.valid) {
    throw new Error(
      `Themes validation failed:\n${validation.errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }

  return config;
};
