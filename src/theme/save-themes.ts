import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ThemesConfig } from './types';

/**
 * Save themes configuration to themes.json
 */
export const saveThemes = (config: ThemesConfig): void => {
  const configPath = join(process.cwd(), 'themes.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
};
