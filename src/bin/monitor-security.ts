#!/usr/bin/env bun
/**
 * Real-time Security Log Monitoring
 *
 * Monitors security logs in real-time and displays new entries as they are written.
 * Useful for local development and debugging.
 *
 * Usage:
 *   bun run src/bin/monitor-security.ts [--level WARN] [--category injection]
 *
 * Options:
 *   --level    Filter by minimum log level (INFO, WARN, ERROR, CRITICAL)
 *   --category Filter by category (injection, validation, rate-limit, alert, system)
 */

import { watch, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { LogLevel } from '../monitoring/logger';
import type { LogEntry, LogCategory } from '../monitoring/logger';

/**
 * Parse command line arguments
 */
function parseArgs(): { level: LogLevel; category?: LogCategory } {
  const args = process.argv.slice(2);
  let level: LogLevel = LogLevel.WARN;
  let category: LogCategory | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--level' && args[i + 1]) {
      const levelStr = args[i + 1].toUpperCase();
      level = LogLevel[levelStr as keyof typeof LogLevel] || LogLevel.WARN;
      i++;
    } else if (args[i] === '--category' && args[i + 1]) {
      category = args[i + 1] as LogCategory;
      i++;
    }
  }

  return { level, category };
}

/**
 * Check if entry should be displayed based on filters
 */
function shouldDisplay(
  entry: LogEntry,
  filterLevel: LogLevel,
  filterCategory?: LogCategory,
): boolean {
  // Check category filter
  if (filterCategory && entry.category !== filterCategory) {
    return false;
  }

  // Check level filter
  const levels = [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
  const entryLevelIndex = levels.indexOf(entry.level);
  const filterLevelIndex = levels.indexOf(filterLevel);

  return entryLevelIndex >= filterLevelIndex;
}

/**
 * Get console color for log level
 */
function getColor(level: LogLevel): string {
  switch (level) {
    case LogLevel.INFO:
      return '\x1b[36m'; // Cyan
    case LogLevel.WARN:
      return '\x1b[33m'; // Yellow
    case LogLevel.ERROR:
      return '\x1b[31m'; // Red
    case LogLevel.CRITICAL:
      return '\x1b[35m\x1b[1m'; // Bold Magenta
    default:
      return '\x1b[0m'; // Reset
  }
}

/**
 * Get icon for log category
 */
function getCategoryIcon(category: LogCategory): string {
  switch (category) {
    case 'injection':
      return '🛡️';
    case 'validation':
      return '✅';
    case 'rate-limit':
      return '⏱️';
    case 'alert':
      return '🚨';
    case 'system':
      return 'ℹ️';
    default:
      return '📝';
  }
}

/**
 * Format log entry for display
 */
function formatEntry(entry: LogEntry): string {
  const color = getColor(entry.level);
  const icon = getCategoryIcon(entry.category);
  const reset = '\x1b[0m';
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();

  let output = `${color}[${timestamp}] ${icon} ${entry.level} - ${entry.category}: ${entry.message}${reset}`;

  // Add context if present
  if (Object.keys(entry.context).length > 0) {
    const contextStr = JSON.stringify(entry.context, null, 2)
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
    output += `\n${contextStr}`;
  }

  return output;
}

/**
 * Read new lines from log file
 */
function readNewLines(
  filePath: string,
  lastPosition: number,
): { lines: string[]; newPosition: number } {
  try {
    const stats = statSync(filePath);
    const fileSize = stats.size;

    if (fileSize <= lastPosition) {
      return { lines: [], newPosition: lastPosition };
    }

    const content = readFileSync(filePath, 'utf-8');
    const allLines = content.trim().split('\n');

    // Calculate how many lines to skip based on position
    const lastContent = content.substring(0, lastPosition);
    const lastLineCount = lastContent ? lastContent.split('\n').length : 0;

    const newLines = allLines.slice(lastLineCount);

    return { lines: newLines, newPosition: fileSize };
  } catch (error) {
    console.error(`Error reading log file: ${error}`);
    return { lines: [], newPosition: lastPosition };
  }
}

/**
 * Main monitoring function
 */
async function main() {
  const { level, category } = parseArgs();

  console.log('🔍 Security Log Monitor');
  console.log(`Filter: Level >= ${level}${category ? `, Category = ${category}` : ''}`);
  console.log('Press Ctrl+C to stop\n');

  const logDir = join(process.cwd(), 'data', 'security-logs');
  const today = new Date().toISOString().split('T')[0];
  const logFile = join(logDir, `security-${today}.log`);

  // Create log file if it doesn't exist
  if (!existsSync(logFile)) {
    console.log(`⏳ Waiting for log file: ${logFile}`);
    console.log('   (File will be created when first log entry is written)\n');
  }

  let lastPosition = 0;

  // Initialize position for existing file
  if (existsSync(logFile)) {
    const stats = statSync(logFile);
    lastPosition = stats.size;
    console.log(`📖 Monitoring existing log file (${(stats.size / 1024).toFixed(2)} KB)\n`);
  }

  // Watch for changes
  const watcher = watch(logFile, (eventType) => {
    if (eventType === 'change') {
      const { lines, newPosition } = readNewLines(logFile, lastPosition);
      lastPosition = newPosition;

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        try {
          const entry = JSON.parse(line) as LogEntry;

          if (shouldDisplay(entry, level, category)) {
            console.log(formatEntry(entry));
          }
        } catch (error) {
          console.error(`Failed to parse log line: ${line}`);
        }
      }
    } else if (eventType === 'rename') {
      console.log('\n⚠️  Log file was renamed or deleted');
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Monitoring stopped');
    watcher.close();
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Error running monitor:', error);
    process.exit(1);
  });
}

export { parseArgs, shouldDisplay, formatEntry };
