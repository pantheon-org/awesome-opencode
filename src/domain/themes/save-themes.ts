import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ThemesConfig } from './types';

/**
 * Save themes configuration to data/themes.json
 */
export const saveThemes = (config: ThemesConfig): void => {
  const configPath = join(process.cwd(), 'data', 'themes.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
};
