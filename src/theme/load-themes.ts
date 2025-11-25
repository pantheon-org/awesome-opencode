import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ThemesConfig } from './types';

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
